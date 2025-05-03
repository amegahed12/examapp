const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * 
 * Purpose:
 * This middleware verifies the JWT token provided in request headers to authenticate users.
 * It's a crucial security layer that protects routes from unauthorized access.
 * 
 * Why JWT?
 * - Stateless: Server doesn't need to store session data
 * - Cross-domain: Works across different domains
 * - Compact: Can be sent through URL, POST parameter, or HTTP header
 * - Self-contained: Contains all necessary user data, reducing database lookups
 */
const authenticateToken = (req, res, next) => {
    // Extract the token from the Authorization header
    // The format should be: "Bearer [token]"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // If no token is provided, deny access immediately
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify that the JWT_SECRET environment variable is set
        // This is a critical security check - without a secret, tokens can't be verified properly
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server configuration error. JWT_SECRET is not set.' });
        }
        
        // Verify the token's signature and decode its payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach the decoded user information to the request object
        // This makes the user info available to subsequent middleware and route handlers
        req.user = decoded;
        
        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        // If token verification fails (expired, tampered with, invalid signature)
        // Return a 403 Forbidden response
        return res.status(403).json({ message: 'Invalid token' });
    }
};

module.exports = {
    authenticateToken
}; 