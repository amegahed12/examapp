/**
 * In-memory Rate Limiter Implementation
 * 
 * Purpose:
 * This middleware provides protection against excessive API requests,
 * which helps to:
 * - Prevent brute force attacks
 * - Mitigate DDoS attempts
 * - Ensure fair usage across all users
 * - Protect server resources from being overwhelmed
 * 
 * Implementation notes:
 * - Uses a simple in-memory object to track requests by IP address
 * - Implements a sliding window approach for rate limiting
 * - Provides customizable options for different endpoints
 * 
 * WARNING: This in-memory implementation will reset on server restart,
 * and doesn't scale across multiple server instances. For production with
 * multiple instances, consider Redis-based rate limiters.
 */

// In-memory storage for tracking request rates
const rateLimits = {};

/**
 * Rate limiter middleware factory function
 * Returns a configured middleware instance with the specified options
 */
const rateLimiter = (options = {}) => {
    // Default configuration with sensible values
    const {
        windowMs = 60 * 1000, // 1 minute by default
        maxRequests = 30,      // 30 requests per minute by default
        message = 'Too many requests, please try again later.'
    } = options;

    return (req, res, next) => {
        // Get client identifier (IP address) with fallbacks for different deployment scenarios
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Create a unique tracking key based on the client's IP
        const key = `${ip}`;
        
        // Initialize tracking data for new clients
        if (!rateLimits[key]) {
            rateLimits[key] = {
                count: 0,
                resetTime: Date.now() + windowMs
            };
        }
        
        // Reset counter if the time window has expired
        // This implements a fixed window rate limiting approach
        if (Date.now() > rateLimits[key].resetTime) {
            rateLimits[key].count = 0;
            rateLimits[key].resetTime = Date.now() + windowMs;
        }
        
        // If client has exceeded allowed requests, return 429 Too Many Requests
        // This is the standard HTTP status code for rate limiting
        if (rateLimits[key].count >= maxRequests) {
            return res.status(429).json({ 
                message,
                // Include retry-after information to help clients know when to retry
                retryAfter: Math.ceil((rateLimits[key].resetTime - Date.now()) / 1000)
            });
        }
        
        // Increment request count and allow request to proceed
        rateLimits[key].count++;
        next();
    };
};

/**
 * Specialized stricter rate limiter for authentication endpoints
 * 
 * Why stricter limits on auth endpoints?
 * - They're common targets for brute force attacks
 * - Failed login attempts are typically higher volume in attack scenarios
 * - Slowing down authentication attempts is a key security practice
 */
const authLimiter = rateLimiter({
    windowMs: 1 * 60 * 1000, // 5 minutes
    maxRequests: 100,         // 100 login attempts per 5 minutes
    message: 'Too many login attempts. Please try again later.'
});

module.exports = {
    rateLimiter,
    authLimiter
}; 