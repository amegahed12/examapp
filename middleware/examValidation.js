/**
 * Exam Validation Middleware
 * 
 * Purpose:
 * This middleware validates exam data before it reaches database operations.
 * Proper validation is critical for:
 * - Data integrity: Ensuring the database contains properly structured data
 * - Security: Preventing injection attacks and malformed data
 * - UX: Providing clear error messages to help users correct issues
 * - Performance: Rejecting invalid data early avoids unnecessary processing
 * 
 * Validation Strategy:
 * - Required fields: Checks that all mandatory fields exist and are valid
 * - Type checking: Ensures data types match expected schema requirements
 * - Content validation: Verifies that actual content meets business rules
 * - Question-specific logic: Applies validation rules based on question type
 * 
 * This validation layer complements Mongoose schema validation but provides
 * more detailed error messages and business logic validation.
 */

// Middleware for validating exam data
const validateExamData = (req, res, next) => {
    try {
        const { title, duration, questions, attemptsAllowed } = req.body;
        
        // Check required fields
        if (!title || !title.trim()) {
            // Empty or whitespace-only titles are rejected
            return res.status(400).json({ message: 'Exam title is required' });
        }
        
        if (!duration || isNaN(duration) || duration <= 0) {
            // Duration must be a positive number
            // This prevents creating exams with invalid durations like -5 minutes
            return res.status(400).json({ message: 'Valid exam duration is required (must be a positive number)' });
        }
        
        // Validate attemptsAllowed if provided
        // This is an optional field with a default in the schema,
        // but if supplied, it must meet these requirements
        if (attemptsAllowed !== undefined) {
            if (isNaN(attemptsAllowed) || attemptsAllowed < 1) {
                return res.status(400).json({ message: 'Attempts allowed must be a positive number' });
            }
        }
        
        // Ensure exam has at least one question
        // An exam without questions has no purpose, so this is a business rule
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'Exam must have at least one question' });
        }
        
        // Validate each question individually
        // This ensures all questions meet the requirements for their specific type
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            // Question text is required and cannot be empty
            if (!q.question || !q.question.trim()) {
                return res.status(400).json({ message: `Question ${i+1} content is missing` });
            }
            
            // Question type must be one of the supported types
            // This prevents arbitrary types from being added
            if (!q.type || !['mcq', 'written', 'truefalse'].includes(q.type)) {
                return res.status(400).json({ message: `Question ${i+1} has invalid type` });
            }
            
            // All questions must have a correct answer for grading purposes
            if (!q.correctAnswer) {
                return res.status(400).json({ message: `Question ${i+1} is missing the correct answer` });
            }
            
            // Multiple choice questions require special validation
            if (q.type === 'mcq') {
                // Ensure there are at least 2 options to choose from
                if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                    return res.status(400).json({ message: `Question ${i+1} needs at least 2 options` });
                }
                
                // Correct answer must be one of the provided options
                // This prevents situations where the answer doesn't match any option
                if (!q.options.includes(q.correctAnswer)) {
                    return res.status(400).json({ message: `Question ${i+1} correct answer must be one of the options` });
                }
            }
            
            // True/False questions require special validation
            if (q.type === 'truefalse' && !['true', 'false'].includes(q.correctAnswer)) {
                // Correct answer must be either 'true' or 'false'
                return res.status(400).json({ message: `Question ${i+1} correct answer must be 'true' or 'false'` });
            }
        }
        
        // If validation passes, proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Catch any unexpected errors during validation
        // This prevents server crashes if the validation logic itself fails
        console.error('Error in exam validation:', error);
        res.status(500).json({ message: 'Server error during validation' });
    }
};

module.exports = {
    validateExamData
}; 