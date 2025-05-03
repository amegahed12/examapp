const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['mcq', 'written', 'truefalse'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [String], // For MCQ
    correctAnswer: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 1
    }
});

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    duration: {
        type: Number, // in minutes
        required: true
    },
    questions: [questionSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    attemptsAllowed: {
        type: Number,
        default: 1,
        min: 1
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema); 