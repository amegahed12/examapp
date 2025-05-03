const mongoose = require('mongoose');

/**
 * Question Schema
 * 
 * Purpose:
 * This schema defines the structure for individual exam questions.
 * It supports multiple question types with type-specific fields.
 * 
 * Design Considerations:
 * - Flexibility: Supports multiple question formats (MCQ, written, true/false)
 * - Point System: Questions can have different weights (points)
 * - Validation: Type-specific validation is handled in middleware
 */
const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['mcq', 'written', 'truefalse'],  // Only these question types are supported
        required: true
    },
    question: {
        type: String,
        required: true  // Every question must have text content
    },
    options: [String],  // For MCQ questions, array of possible answers
    correctAnswer: {
        type: String,
        required: true  // Every question needs a correct answer for grading
    },
    points: {
        type: Number,
        default: 1  // Default weight is 1 point, but can be customized
    }
});

/**
 * Exam Schema
 * 
 * Purpose:
 * This schema defines the structure for exams in the application.
 * It contains metadata about the exam and an array of questions.
 * 
 * Key Design Decisions:
 * 1. Nested Structure: Questions are embedded for better performance
 * 2. Time Limits: Duration enforces time constraints on exam attempts
 * 3. Activity Control: isActive flag allows disabling exams without deletion
 * 4. Attempt Limiting: attemptsAllowed controls how many times a user can take an exam
 * 5. Ownership: createdBy tracks which admin created each exam
 * 6. Timestamps: Creation and update times tracked automatically
 */
const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true  // Every exam must have a title
    },
    description: String,  // Optional description for additional context
    duration: {
        type: Number,    // Duration in minutes
        required: true   // Time limit is mandatory
    },
    questions: [questionSchema],  // Embedded array of questions
    isActive: {
        type: Boolean,
        default: true    // Exams are active by default
    },
    attemptsAllowed: {
        type: Number,
        default: 1,      // By default, users can only take an exam once
        min: 1           // At least one attempt must be allowed
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',     // Reference to the admin user who created this exam
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now // Explicit creation timestamp
    }
}, { timestamps: true }); // Also adds updatedAt field automatically

module.exports = mongoose.model('Exam', examSchema); 