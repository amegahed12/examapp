// A simple in-memory rate limiter
const rateLimits = {};

// Rate limiter middleware
const rateLimiter = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute by default
        maxRequests = 30,      // 30 requests per minute by default
        message = 'Too many requests, please try again later.'
    } = options;

    return (req, res, next) => {
        // Get client identifier (IP address)
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Tracking key 
        const key = `${ip}`;
        
        // Initialize if first request from this IP
        if (!rateLimits[key]) {
            rateLimits[key] = {
                count: 0,
                resetTime: Date.now() + windowMs
            };
        }
        
        // Reset counter if time window expired
        if (Date.now() > rateLimits[key].resetTime) {
            rateLimits[key].count = 0;
            rateLimits[key].resetTime = Date.now() + windowMs;
        }
        
        // Check if rate limit exceeded
        if (rateLimits[key].count >= maxRequests) {
            return res.status(429).json({ 
                message,
                retryAfter: Math.ceil((rateLimits[key].resetTime - Date.now()) / 1000)
            });
        }
        
        // Increment request count
        rateLimits[key].count++;
        next();
    };
};

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimiter({
    windowMs: 1 * 60 * 1000, // 5 minutes
    maxRequests: 100,         // 100 login attempts per 5 minutes
    message: 'Too many login attempts. Please try again later.'
});

module.exports = {
    rateLimiter,
    authLimiter
}; 