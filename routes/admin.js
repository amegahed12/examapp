const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const User = require('../models/User');
const ExamAttempt = require('../models/examAttempt');
const jwt = require('jsonwebtoken');
const { validateExamData } = require('../middleware/examValidation');

// Middleware to verify admin role
const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Check if JWT_SECRET is set
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server configuration error. JWT_SECRET is not set.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify that userId exists
        if (!decoded.userId) {
            return res.status(403).json({ message: 'Invalid token format' });
        }
        
        // Check if the user has admin role
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Create new exam
router.post('/exams', adminAuth, validateExamData, async (req, res) => {
    try {
        const { title, description, duration, questions, attemptsAllowed } = req.body;
        const exam = new Exam({
            title,
            description,
            duration,
            questions,
            attemptsAllowed: attemptsAllowed || 1, // Default to 1 if not provided
            createdBy: req.user.userId
        });

        await exam.save();
        res.status(201).json({ message: 'Exam created successfully', exam });
    } catch (error) {
        res.status(500).json({ message: 'Error creating exam', error: error.message });
    }
});

// Update exam
router.put('/exams/:id', adminAuth, validateExamData, async (req, res) => {
    try {
        // Explicitly extract the fields we want to update
        const { 
            title, 
            description, 
            duration, 
            questions, 
            attemptsAllowed, 
            isActive 
        } = req.body;
        
        // Build update object with all provided fields
        const updateData = {
            title,
            description,
            duration,
            questions
        };
        
        // Add optional fields if provided
        if (attemptsAllowed !== undefined) {
            updateData.attemptsAllowed = attemptsAllowed;
        }
        
        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }
        
        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );
        
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        
        res.json({ message: 'Exam updated successfully', exam });
    } catch (error) {
        res.status(500).json({ message: 'Error updating exam', error: error.message });
    }
});

// Delete exam
router.delete('/exams/:id', adminAuth, async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting exam', error: error.message });
    }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get user exam attempts
router.get('/users/:userId/exams', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get exam attempts from ExamAttempt collection
        const examAttempts = await ExamAttempt.find({ user: req.params.userId })
            .populate('exam', 'title duration');
            
        res.json(examAttempts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user exam attempts', error: error.message });
    }
});

// Get specific exam results
router.get('/exams/:examId/results', adminAuth, async (req, res) => {
    try {
        // Get exam attempts from ExamAttempt collection
        const attempts = await ExamAttempt.find({ exam: req.params.examId })
            .populate('user', 'username');

        const results = attempts.map(attempt => {
            return {
                userId: attempt.user._id,
                username: attempt.user.username,
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                startTime: attempt.startTime,
                endTime: attempt.endTime
            };
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam results', error: error.message });
    }
});

// Get admin statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalExams = await Exam.countDocuments();
        
        res.json({
            totalUsers,
            totalExams
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
});

// Get all exams
router.get('/exams', adminAuth, async (req, res) => {
    try {
        const exams = await Exam.find().sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams', error: error.message });
    }
});

// Get a specific exam by ID
router.get('/exams/:id', adminAuth, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam', error: error.message });
    }
});

module.exports = router; 