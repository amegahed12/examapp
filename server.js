/**
 * Exam Application Server
 * 
 * This is the main entry point for the exam application backend.
 * It configures the Express server, connects to MongoDB,
 * sets up middleware, and defines the application routes.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { authenticateToken } = require('./middleware/authMiddleware');
const { rateLimiter } = require('./middleware/rateLimiter');
const Exam = require('./models/Exam');
const ExamAttempt = require('./models/examAttempt');

// Load environment variables from .env file
// This allows for different configurations in development and production
dotenv.config();

// Initialize the Express application
const app = express();

/**
 * Middleware Configuration
 * 
 * Order matters for middleware:
 * 1. CORS - Allow cross-origin requests (for frontend-backend separation)
 * 2. JSON parsing - Parse request bodies as JSON
 * 3. Static files - Serve the frontend files from the public directory
 * 4. Rate limiting - Prevent abuse by limiting request frequency
 */
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(rateLimiter()); // Apply rate limiting to all routes

/**
 * Database Connection
 * 
 * Connect to MongoDB using environment variables or fallback to local database.
 * The connection uses mongoose's unified topology and new URL parser for
 * compatibility with newer MongoDB versions.
 */
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    // Exit with failure if unable to connect to MongoDB
    // This ensures the application doesn't run without database access
    process.exit(1);
});

/**
 * MongoDB Connection Event Handlers
 * 
 * These event listeners provide visibility into database connection status
 * and help with debugging connection issues.
 */
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
});

/**
 * Route Configuration
 * 
 * The application uses a modular routing approach with separate files for:
 * - Authentication (login, register, etc.)
 * - Exam management (creating, taking exams)
 * - Administrative functions
 * 
 * This separation helps with code organization and maintainability.
 */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/admin', require('./routes/admin'));

/**
 * Default Route
 * 
 * Redirect to the login page for any requests to the root URL.
 * This provides a better user experience than showing a 404 error.
 */
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

/**
 * Global Error Handler
 * 
 * This middleware catches any errors that occur during request processing
 * and returns a standardized error response to the client.
 * It prevents the application from crashing on unhandled exceptions.
 */
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

/**
 * Server Startup
 * 
 * Start the Express server on the specified port or default to 8080.
 * The port can be configured via environment variables for deployment flexibility.
 */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 