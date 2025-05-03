// Middleware for validating exam data
const validateExamData = (req, res, next) => {
    try {
        const { title, duration, questions, attemptsAllowed } = req.body;
        
        // Check required fields
        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Exam title is required' });
        }
        
        if (!duration || isNaN(duration) || duration <= 0) {
            return res.status(400).json({ message: 'Valid exam duration is required (must be a positive number)' });
        }
        
        // Validate attemptsAllowed if provided
        if (attemptsAllowed !== undefined) {
            if (isNaN(attemptsAllowed) || attemptsAllowed < 1) {
                return res.status(400).json({ message: 'Attempts allowed must be a positive number' });
            }
        }
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'Exam must have at least one question' });
        }
        
        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            if (!q.question || !q.question.trim()) {
                return res.status(400).json({ message: `Question ${i+1} content is missing` });
            }
            
            if (!q.type || !['mcq', 'written', 'truefalse'].includes(q.type)) {
                return res.status(400).json({ message: `Question ${i+1} has invalid type` });
            }
            
            if (!q.correctAnswer) {
                return res.status(400).json({ message: `Question ${i+1} is missing the correct answer` });
            }
            
            // For MCQ, validate options
            if (q.type === 'mcq') {
                if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                    return res.status(400).json({ message: `Question ${i+1} needs at least 2 options` });
                }
                
                if (!q.options.includes(q.correctAnswer)) {
                    return res.status(400).json({ message: `Question ${i+1} correct answer must be one of the options` });
                }
            }
            
            // For true/false, validate correctAnswer
            if (q.type === 'truefalse' && !['true', 'false'].includes(q.correctAnswer)) {
                return res.status(400).json({ message: `Question ${i+1} correct answer must be 'true' or 'false'` });
            }
        }
        
        next();
    } catch (error) {
        console.error('Error in exam validation:', error);
        res.status(500).json({ message: 'Server error during validation' });
    }
};

module.exports = {
    validateExamData
}; 