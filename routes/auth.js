/**
 * Authentication Routes
 * 
 * This module handles all authentication-related endpoints including:
 * - User registration
 * - User login
 * - Token verification
 * - Logout
 * 
 * Security Considerations:
 * - Password hashing is handled by the User model
 * - Rate limiting is applied to prevent brute force attacks
 * - JWT tokens are used for stateless authentication
 * - Error messages are generic to prevent information leakage
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * Register New User
 * 
 * POST /api/auth/register
 * 
 * Creates a new user account with the provided credentials.
 * The password is automatically hashed by the User model's pre-save hook.
 * Returns a JWT token that can be used for authenticated requests.
 * 
 * Rate limited to prevent abuse and account enumeration attacks.
 */
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Check if user already exists
        // This prevents duplicate accounts with the same username
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create new user
        // The password will be automatically hashed by the User model
        const user = new User({
            username,
            password,
            role: role || 'user'  // Default to regular user if role not specified
        });

        await user.save();

        // Check if JWT_SECRET is set
        // This is a critical security check to prevent running without proper configuration
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server configuration error. JWT_SECRET is not set.' });
        }

        // Generate JWT token with consistent payload structure
        // The token contains minimal user information to reduce size
        // 24-hour expiration provides security while reducing login frequency
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success with token and minimal user information
        // We never return the password hash, even though it's already hashed
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

/**
 * User Login
 * 
 * POST /api/auth/login
 * 
 * Authenticates a user with username and password.
 * Returns a JWT token that can be used for authenticated requests.
 * 
 * Security measures:
 * - Rate limited to prevent brute force attacks
 * - Generic error messages to prevent username enumeration
 * - Password comparison uses timing-safe bcrypt comparison
 */
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            // Generic error message doesn't reveal if username exists
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password using the comparePassword method from the User model
        // This uses bcrypt.compare which is timing-safe to prevent timing attacks
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check JWT configuration 
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server configuration error. JWT_SECRET is not set.' });
        }

        // Generate token with same structure as registration
        // Consistency in token payload structure simplifies client-side handling
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success with token and user information
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

/**
 * User Logout
 * 
 * POST /api/auth/logout
 * 
 * Since JWTs are stateless, the server doesn't actually need to do anything
 * for logout. The client should discard the token on their end.
 * 
 * This endpoint exists for consistency and to provide a clear API.
 */
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

/**
 * Verify Token
 * 
 * GET /api/auth/verify
 * 
 * Validates that a token is valid and returns the associated user information.
 * Used by the frontend to verify a stored token and restore user sessions.
 * 
 * This route is not rate limited since it's meant to be called frequently
 * and doesn't pose the same security risks as login attempts.
 */
router.get('/verify', async (req, res) => {
    try {
        // Extract token from Authorization header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify JWT configuration
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server configuration error. JWT_SECRET is not set.' });
        }

        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find the user to ensure they still exist in the database
        // This prevents using tokens for deleted users
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Return user information (without token)
        res.json({
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        // If token verification fails for any reason
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router; 