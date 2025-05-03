const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * 
 * Purpose:
 * This schema defines the structure for user data in the application.
 * It stores authentication information, role-based permissions,
 * and exam attempt history for each user.
 * 
 * Key Design Decisions:
 * 1. Password Security: Passwords are never stored in plain text
 * 2. Role-Based Access: Simple role system with 'user' and 'admin' roles
 * 3. Exam History: Embedded array stores all user exam attempts
 * 4. Timestamps: Creation and update times tracked automatically
 */
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,   // Prevents duplicate usernames
        trim: true      // Removes whitespace from both ends
    },
    password: {
        type: String,
        required: true
        // Password is stored as a hash, never in plain text
    },
    role: {
        type: String,
        enum: ['user', 'admin'],  // Restrict to only valid roles
        default: 'user'           // Most users are regular users by default
    },
    examAttempts: [{
        // Store records of each exam a user attempts
        // This embedded schema allows for quick access to a user's history
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam'  // Reference to the Exam model
        },
        score: Number,  // User's score on this attempt
        answers: [{
            questionId: mongoose.Schema.Types.ObjectId,
            answer: String,
            isCorrect: Boolean   // Track correctness for each answer
        }],
        startTime: Date,  // When user started the exam
        endTime: Date     // When user completed the exam
    }]
}, { timestamps: true });  // Automatically add createdAt and updatedAt fields

/**
 * Password Hashing Middleware
 * 
 * This pre-save hook automatically hashes passwords before storing them.
 * It only runs when the password field has been modified.
 * 
 * Security benefits:
 * - Prevents plain text password storage
 * - Uses bcrypt with salt rounds of 10 (industry standard)
 * - Even administrators cannot see user passwords
 */
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    // Generate a secure hash with a cost factor of 10
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

/**
 * Password Comparison Method
 * 
 * This method allows for secure password checking without exposing the hash.
 * It compares a plain text password against the stored hash.
 * 
 * @param {string} candidatePassword - The plain text password to check
 * @returns {boolean} - True if the password matches, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 