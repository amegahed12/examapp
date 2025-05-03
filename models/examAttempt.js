const mongoose = require('mongoose');

/**
 * Exam Attempt Schema
 * 
 * Purpose:
 * This schema captures a user's attempt at an exam, including their answers,
 * score, timing information, and submission details.
 * 
 * Design Considerations:
 * 1. Separate Model: Exam attempts are stored in a dedicated collection rather than
 *    just within the User model for:
 *    - Improved query performance for analytics
 *    - Cleaner data organization
 *    - Support for querying across all attempts (e.g., for reporting)
 * 
 * 2. References: Links to both User and Exam models to maintain relationships
 *    while keeping collections normalized
 * 
 * 3. Complete Record: Each attempt stores enough information to reconstruct
 *    the entire exam session, even if the original exam is later modified
 *    or deleted
 */
const examAttemptSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',       // Reference to the exam that was taken
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',       // Reference to the user who took the exam
        required: true
    },
    answers: {
        type: [String],    // Array of user's answers in order of questions
        required: true     // Must record answers even if they're blank
    },
    score: {
        type: Number,      // Numeric score achieved
        required: true     // Every attempt must be scored
    },
    totalQuestions: {
        type: Number,      // Total questions in the exam at time of attempt
        required: true     // Important for calculating percentage score
    },
    startTime: {
        type: Date,        // When the user began the exam
        required: true     // Required to track time spent
    },
    endTime: {
        type: Date,        // When the user finished the exam
        required: true     // Required to determine if time limit was exceeded
    },
    submittedAt: {
        type: Date,        // When the attempt was submitted to the server
        default: Date.now  // Defaults to submission time
    }
});

// Create a compound index on user and exam for efficient querying
// This helps quickly find all attempts by a specific user for a specific exam
examAttemptSchema.index({ user: 1, exam: 1 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema); 