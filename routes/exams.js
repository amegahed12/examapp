const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const User = require('../models/User');
const ExamAttempt = require('../models/examAttempt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get all active exams
router.get('/', authenticateToken, async (req, res) => {
    try {
        const exams = await Exam.find({ isActive: true });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams', error: error.message });
    }
});

// Get user's exam history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        // Find all exam attempts by this user
        const attempts = await ExamAttempt.find({ user: req.user.userId })
            .populate('exam', 'title description duration')
            .sort({ submittedAt: -1 });

        res.json(attempts);
    } catch (error) {
        console.error('Error fetching exam history:', error);
        res.status(500).json({ message: 'Error fetching exam history', error: error.message });
    }
});

// Get specific attempt details
router.get('/attempts/:attemptId', authenticateToken, async (req, res) => {
    try {
        const attempt = await ExamAttempt.findById(req.params.attemptId)
            .populate('exam');
            
        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }
        
        // Ensure the user owns this attempt
        if (attempt.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        res.json(attempt);
    } catch (error) {
        console.error('Error fetching attempt details:', error);
        res.status(500).json({ message: 'Error fetching attempt details', error: error.message });
    }
});

// Get a specific exam
router.get('/:id', authenticateToken, async (req, res) => {
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

// Get exam attempts
router.get('/:id/attempts', authenticateToken, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const attempts = await ExamAttempt.find({
            exam: req.params.id,
            user: req.user.userId
        });

        res.json({ exam, attempts });
    } catch (error) {
        console.error('Error checking exam attempts:', error);
        res.status(500).json({ message: 'Error checking exam attempts' });
    }
});

// Start an exam
router.post('/:id/start', authenticateToken, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        console.log('Starting exam:', exam.title);
        console.log('Attempts allowed:', exam.attemptsAllowed);

        // Check if user has already attempted this exam and reached the maximum attempts
        const attempts = await ExamAttempt.find({
            exam: req.params.id,
            user: req.user.userId
        });
        
        console.log('User previous attempts count:', attempts.length);
        
        if (attempts.length >= exam.attemptsAllowed) {
            console.log('Maximum attempts reached');
            return res.status(400).json({ message: `Maximum ${exam.attemptsAllowed} attempt(s) reached` });
        } else {
            console.log('User can attempt exam. Attempts used:', attempts.length, 'of', exam.attemptsAllowed);
        }

        res.json({
            message: 'Exam started successfully',
            exam,
            startTime: new Date()
        });
    } catch (error) {
        console.error('Error starting exam:', error);
        res.status(500).json({ message: 'Error starting exam', error: error.message });
    }
});

// Submit exam
router.post('/:id/submit', authenticateToken, async (req, res) => {
    try {
        console.log('Submit exam request received in router:', req.params.id);
        console.log('Request body:', req.body);
        console.log('User ID:', req.user.userId);
        
        // Validate exam
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            console.log('Exam not found:', req.params.id);
            return res.status(404).json({ message: 'Exam not found' });
        }
        console.log('Exam found:', exam.title);
        console.log('Attempts allowed for this exam:', exam.attemptsAllowed);

        // Check if user has already attempted this exam
        const attempts = await ExamAttempt.find({
            exam: req.params.id,
            user: req.user.userId
        });
        console.log('Previous attempts:', attempts.length, 'attempts allowed:', exam.attemptsAllowed);

        if (attempts.length >= exam.attemptsAllowed) {
            console.log('Maximum attempts reached');
            return res.status(403).json({ message: `Maximum attempts reached (${attempts.length}/${exam.attemptsAllowed})` });
        }

        // Validate answers
        const { answers, startTime } = req.body;
        
        if (!answers || !Array.isArray(answers)) {
            console.log('Invalid answers format:', answers);
            return res.status(400).json({ message: 'Invalid answers format' });
        }
        
        if (answers.length !== exam.questions.length) {
            console.log('Answer count mismatch:', answers.length, 'vs', exam.questions.length);
            return res.status(400).json({ message: 'Answer count does not match question count' });
        }

        // Calculate score
        let score = 0;
        exam.questions.forEach((question, index) => {
            console.log(`Question ${index + 1} - Type: ${question.type}, User answer: ${answers[index]}, Correct answer: ${question.correctAnswer}`);
            
            if (question.type === 'mcq' || question.type === 'truefalse') {
                if (answers[index] === question.correctAnswer) {
                    score++;
                    console.log(`Question ${index + 1} - Correct!`);
                }
            }
        });
        
        console.log('Final score:', score, 'out of', exam.questions.length);

        // Create new exam attempt
        const attempt = new ExamAttempt({
            exam: req.params.id,
            user: req.user.userId,
            answers: answers,
            score: score,
            totalQuestions: exam.questions.length,
            startTime: startTime ? new Date(parseInt(startTime)) : new Date(),
            endTime: new Date()
        });

        console.log('Saving exam attempt:', attempt);
        await attempt.save();
        console.log('Exam attempt saved successfully with ID:', attempt._id);
        
        res.json(attempt);
    } catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({ message: 'Error submitting exam: ' + error.message });
    }
});

// Create a sample exam (for testing)
router.post('/sample', authenticateToken, async (req, res) => {
    try {
        const sampleExam = new Exam({
            title: 'Sample Exam',
            description: 'This is a sample exam for testing purposes',
            duration: 30,
            isActive: true,
            questions: [
                {
                    question: 'What is 2 + 2?',
                    type: 'mcq',
                    options: ['3', '4', '5', '6'],
                    correctAnswer: '4'
                },
                {
                    question: 'Is JavaScript a programming language?',
                    type: 'truefalse',
                    correctAnswer: 'true'
                }
            ]
        });

        await sampleExam.save();
        res.status(201).json({ message: 'Sample exam created successfully', exam: sampleExam });
    } catch (error) {
        res.status(500).json({ message: 'Error creating sample exam', error: error.message });
    }
});

module.exports = router; 