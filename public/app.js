// Global variables
let currentUser = null;
let currentExam = null;
let currentQuestionIndex = 0;
let timer = null;
let userAnswers = {};
let markedQuestions = [];
let examStartTime = null;
let examEndTime = null;
let timerInterval = null;
let currentAttempt = null;

// DOM Elements
const userDashboard = document.getElementById('user-dashboard');
const examSection = document.getElementById('exam-section');
const adminDashboard = document.getElementById('admin-dashboard');
const attemptDetailsSection = document.getElementById('attempt-details-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const adminLoginForm = document.getElementById('admin-login-form');
const examsList = document.getElementById('exams-list');
const historyList = document.getElementById('history-list');
const examTitle = document.getElementById('exam-title');
const timeRemaining = document.getElementById('time-remaining');
const currentQuestion = document.getElementById('current-question');
const prevQuestionBtn = document.getElementById('prev-question');
const nextQuestionBtn = document.getElementById('next-question');
const markReviewBtn = document.getElementById('mark-review');
const submitExamBtn = document.getElementById('submit-exam');
const logoutBtn = document.querySelectorAll('#logout-btn');
const createExamBtn = document.getElementById('create-exam');
const viewUsersBtn = document.getElementById('view-users');
const viewResultsBtn = document.getElementById('view-results');
const adminContent = document.getElementById('admin-content');
const availableExamsTab = document.getElementById('available-exams-tab');
const examHistoryTab = document.getElementById('exam-history-tab');
const availableExamsContent = document.getElementById('available-exams-content');
const examHistoryContent = document.getElementById('exam-history-content');
const backToHistoryBtn = document.getElementById('back-to-history-btn');
const attemptDetailsContainer = document.getElementById('attempt-details-container');

// Event Listeners
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (registerForm) registerForm.addEventListener('submit', handleRegister);
if (adminLoginForm) adminLoginForm.addEventListener('submit', handleAdminLogin);
if (prevQuestionBtn) prevQuestionBtn.addEventListener('click', showPreviousQuestion);
if (nextQuestionBtn) nextQuestionBtn.addEventListener('click', showNextQuestion);
if (markReviewBtn) markReviewBtn.addEventListener('click', markQuestionForReview);
if (submitExamBtn) submitExamBtn.addEventListener('click', submitExam);
if (createExamBtn) createExamBtn.addEventListener('click', showCreateExamForm);
if (viewUsersBtn) viewUsersBtn.addEventListener('click', showUsersList);
if (viewResultsBtn) viewResultsBtn.addEventListener('click', showAdminExamResults);
if (backToHistoryBtn) backToHistoryBtn.addEventListener('click', backToHistory);

// Apply logout functionality to all logout buttons
logoutBtn.forEach(btn => {
    if (btn) btn.addEventListener('click', handleLogout);
});

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    console.log('Attempting login with username:', username);

    try {
        console.log('Sending login request to server...');
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        console.log('Server response status:', response.status);
        const data = await response.json();
        console.log('Server response data:', data);

        if (response.ok) {
            if (data.user.role === 'admin') {
                alert('Please use the admin login page for admin accounts');
                return;
            }
            console.log('Login successful, redirecting...');
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            console.log('Login failed:', data.message);
            alert(data.message);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Error logging in');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                password
                // Role is determined by the server based on configuration
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error registering');
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok && data.user.role === 'admin') {
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            alert('Invalid admin credentials');
        }
    } catch (error) {
        alert('Error logging in');
    }
}

// Dashboard Functions
async function showDashboard() {
    if (currentUser.role === 'admin') {
        adminDashboard.classList.remove('hidden');
        userDashboard.classList.add('hidden');
        examSection.classList.add('hidden');
        attemptDetailsSection.classList.add('hidden');
        showAdminDashboard();
    } else {
        userDashboard.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
        examSection.classList.add('hidden');
        attemptDetailsSection.classList.add('hidden');
        
        // Set up tab event listeners
        setupDashboardTabs();
        
        // Load available exams by default
        loadExams();
    }
}

function setupDashboardTabs() {
    // Add event listeners to tabs
    availableExamsTab.addEventListener('click', () => {
        setActiveTab(availableExamsTab, availableExamsContent);
        loadExams();
    });
    
    examHistoryTab.addEventListener('click', () => {
        setActiveTab(examHistoryTab, examHistoryContent);
        loadExamHistory();
    });
}

function setActiveTab(activeTab, activeContent) {
    // Reset all tabs
    availableExamsTab.classList.remove('active');
    examHistoryTab.classList.remove('active');
    availableExamsContent.classList.remove('active');
    examHistoryContent.classList.remove('active');
    
    // Set active tab
    activeTab.classList.add('active');
    activeContent.classList.add('active');
}

async function loadExamHistory() {
    historyList.innerHTML = '<div class="loading">Loading your exam history...</div>';
    
    try {
        const response = await fetch('/api/exams/history', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load exam history');
        }

        const attempts = await response.json();
        displayExamHistory(attempts);
    } catch (error) {
        console.error('Error loading exam history:', error);
        historyList.innerHTML = `
            <div class="error-message">
                <h3>Error Loading History</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displayExamHistory(attempts) {
    if (attempts.length === 0) {
        historyList.innerHTML = '<p>You have not taken any exams yet.</p>';
        return;
    }

    historyList.innerHTML = '';

    attempts.forEach(attempt => {
        // Calculate percentage score
        const scorePercentage = (attempt.score / attempt.totalQuestions) * 100;
        let scoreClass = 'score-medium';
        
        if (scorePercentage >= 80) {
            scoreClass = 'score-high';
        } else if (scorePercentage < 50) {
            scoreClass = 'score-low';
        }

        const attemptCard = document.createElement('div');
        attemptCard.className = 'history-card';

        // Check if exam exists or was deleted
        const examTitle = attempt.exam ? attempt.exam.title : 'Deleted Exam';
        
        attemptCard.innerHTML = `
            <div class="history-card-header">
                <span class="history-card-title">${examTitle}</span>
                <span class="history-card-score ${scoreClass}">${attempt.score}/${attempt.totalQuestions} (${scorePercentage.toFixed(1)}%)</span>
            </div>
            <div class="history-card-date">
                <span>Submitted: ${new Date(attempt.submittedAt).toLocaleString()}</span>
            </div>
            <div class="history-card-details">
                <button class="history-card-action" data-attempt-id="${attempt._id}">View Details</button>
            </div>
        `;

        historyList.appendChild(attemptCard);
    });

    // Add event listeners to detail buttons
    document.querySelectorAll('.history-card-action').forEach(button => {
        button.addEventListener('click', (e) => {
            const attemptId = e.target.dataset.attemptId;
            if (attemptId) {
                viewAttemptDetails(attemptId);
            }
        });
    });
}

async function viewAttemptDetails(attemptId) {
    try {
        const response = await fetch(`/api/exams/attempts/${attemptId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load attempt details');
        }

        currentAttempt = await response.json();
        displayAttemptDetails();
        
        // Show the attempt details section
        userDashboard.classList.add('hidden');
        attemptDetailsSection.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading attempt details:', error);
        alert('Error loading attempt details');
    }
}

function displayAttemptDetails() {
    if (!currentAttempt || !currentAttempt.exam) {
        attemptDetailsContainer.innerHTML = '<p>Error: Attempt details not available.</p>';
        return;
    }

    const scorePercentage = (currentAttempt.score / currentAttempt.totalQuestions) * 100;
    const examDuration = currentAttempt.endTime ? 
        Math.round((new Date(currentAttempt.endTime) - new Date(currentAttempt.startTime)) / (60 * 1000)) : 
        'N/A';

    // Generate the attempt summary HTML
    attemptDetailsContainer.innerHTML = `
        <h3>${currentAttempt.exam.title}</h3>
        <div class="attempt-summary">
            <div class="summary-item">
                <div class="summary-label">Score</div>
                <div class="summary-value">${currentAttempt.score}/${currentAttempt.totalQuestions} (${scorePercentage.toFixed(1)}%)</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Date Taken</div>
                <div class="summary-value">${new Date(currentAttempt.submittedAt).toLocaleDateString()}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Time Spent</div>
                <div class="summary-value">${examDuration} minutes</div>
            </div>
        </div>
        
        <h3>Questions and Answers</h3>
        <div class="attempt-questions">
            ${generateQuestionsAnswersHTML()}
        </div>
    `;
}

function generateQuestionsAnswersHTML() {
    if (!currentAttempt.exam.questions || !currentAttempt.answers) {
        return '<p>No questions or answers available.</p>';
    }

    let questionsHTML = '';

    currentAttempt.exam.questions.forEach((question, index) => {
        const userAnswer = currentAttempt.answers[index] || 'No answer provided';
        const isCorrect = question.correctAnswer === userAnswer;
        let answerDisplay;

        // Format the answer display based on question type
        if (question.type === 'mcq') {
            const selectedOption = question.options.find(opt => opt === userAnswer) || 'No answer';
            answerDisplay = selectedOption;
        } else if (question.type === 'truefalse') {
            answerDisplay = userAnswer === 'true' ? 'True' : 'False';
        } else {
            answerDisplay = userAnswer;
        }

        questionsHTML += `
            <div class="attempt-question">
                <div class="question-header">Question ${index + 1}: ${question.question}</div>
                <div class="user-answer ${isCorrect ? 'answer-correct' : 'answer-incorrect'}">
                    <strong>Your Answer:</strong> ${answerDisplay}
                </div>
                ${question.type !== 'written' ? 
                    `<div class="correct-answer">
                        <strong>Correct Answer:</strong> ${question.correctAnswer}
                    </div>` : 
                    ''}
            </div>
        `;
    });

    return questionsHTML;
}

async function loadExams() {
    try {
        const response = await fetch('/api/exams', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const exams = await response.json();
            displayExams(exams);
        } else {
            throw new Error('Failed to load exams');
        }
    } catch (error) {
        console.error('Error loading exams:', error);
        alert('Error loading exams');
    }
}

function displayExams(exams) {
    const examsList = document.getElementById('exams-list');
    examsList.innerHTML = '';

    exams.forEach(exam => {
        const examCard = document.createElement('div');
        examCard.className = 'exam-card';
        examCard.innerHTML = `
            <h3>${exam.title}</h3>
            <p>${exam.description || ''}</p>
            <p>Duration: ${exam.duration} minutes</p>
            <p>Attempts Allowed: ${exam.attemptsAllowed}</p>
            <button class="start-exam-btn" data-exam-id="${exam._id}">Start Exam</button>
        `;
        examsList.appendChild(examCard);
    });

    // Add event listeners for start exam buttons
    document.querySelectorAll('.start-exam-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const examId = e.target.dataset.examId;
            if (examId) {
                startExam(examId);
            }
        });
    });
}

// Exam Functions
async function startExam(examId) {
    try {
        // Reset any previous exam state to ensure a clean start
        resetExamState();
        
        // Check if user has already attempted this exam
        const response = await fetch(`/api/exams/${examId}/attempts`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to check exam attempts');
        }

        const data = await response.json();
        const exam = data.exam;
        const attempts = data.attempts;

        if (attempts.length >= exam.attemptsAllowed) {
            alert(`You have already used all ${exam.attemptsAllowed} attempts for this exam.`);
            return;
        }

        // Start the exam
        currentExam = exam;
        currentQuestionIndex = 0;
        userAnswers = {};
        markedQuestions = [];
        examStartTime = Date.now();
        examEndTime = examStartTime + (exam.duration * 60 * 1000);

        console.log('Exam started:', exam.title);
        console.log('Questions:', exam.questions.length);
        
        // Initialize exam section with proper structure
        initializeExamSection(exam.title);
        
        // Show the exam section
        userDashboard.classList.add('hidden');
        examSection.classList.remove('hidden');

        // Display the first question
        showQuestion();
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    } catch (error) {
        console.error('Error starting exam:', error);
        alert('Error starting exam');
    }
}

// Function to initialize the exam section with proper HTML structure
function initializeExamSection(title) {
    examSection.innerHTML = `
        <div class="exam-header">
            <h2 id="exam-title">${title}</h2>
            <div class="header-right">
                <div id="timer">Time remaining: <span id="time-remaining">00:00</span></div>
                <button class="logout-btn">Logout</button>
            </div>
        </div>
        <div id="question-container">
            <div class="exam-layout">
                <div id="question-nav-panel">
                    <h3>Questions</h3>
                    <div id="question-nav-buttons">
                        <!-- Question navigation buttons will be added here dynamically -->
                    </div>
                </div>
                <div class="question-content">
                    <div id="question-number"></div>
                    <div id="current-question"></div>
                    <div class="navigation-buttons">
                        <button id="prev-question" disabled>Previous</button>
                        <button id="next-question">Next</button>
                        <button id="mark-review">Mark for Review</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="submit-section">
            <button id="submit-exam">Submit Exam</button>
        </div>
    `;
    
    // Add event listeners directly to the elements in the DOM
    const newPrevBtn = document.getElementById('prev-question');
    const newNextBtn = document.getElementById('next-question');
    const newMarkReviewBtn = document.getElementById('mark-review');
    const newSubmitBtn = document.getElementById('submit-exam');
    
    // Attach event listeners to these new elements
    if (newPrevBtn) newPrevBtn.addEventListener('click', showPreviousQuestion);
    if (newNextBtn) newNextBtn.addEventListener('click', showNextQuestion);
    if (newMarkReviewBtn) newMarkReviewBtn.addEventListener('click', markQuestionForReview);
    if (newSubmitBtn) newSubmitBtn.addEventListener('click', submitExam);
    
    // Add logout event listener
    examSection.querySelector('.logout-btn').addEventListener('click', handleLogout);
    
    // Initialize the navigation panel
    updateQuestionNavigationPanel();
}

function updateTimer() {
    if (!currentExam || !examStartTime) {
        return;
    }
    
    const now = new Date();
    const elapsedTime = Math.floor((now - examStartTime) / 1000); // in seconds
    const durationInSeconds = currentExam.duration * 60;
    
    const remainingSeconds = Math.max(0, durationInSeconds - elapsedTime);
    
    // Get the time remaining element directly from the DOM
    const timeRemainingEl = document.getElementById('time-remaining');
    if (!timeRemainingEl) return;
    
    // Auto-submit when time is up
    if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timeRemainingEl.textContent = "Time's up!";
        timeRemainingEl.classList.add('time-up');
        
        // Disable navigation buttons
        const prevBtn = document.getElementById('prev-question');
        const nextBtn = document.getElementById('next-question');
        const markBtn = document.getElementById('mark-review');
        
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (markBtn) markBtn.disabled = true;
        
        // Auto submit after a short delay to allow user to see the message
        setTimeout(() => {
            alert("Time's up! Your exam will be submitted now.");
            submitExam();
        }, 1000);
        return;
    }
    
    // Format remaining time
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    timeRemainingEl.textContent = `Time Remaining: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    // Add warning class when less than 5 minutes remaining
    if (remainingSeconds < 300 && !timeRemainingEl.classList.contains('time-warning')) {
        timeRemainingEl.classList.add('time-warning');
    }
}

function showQuestion() {
    if (!currentExam || !currentExam.questions || 
        currentExam.questions.length === 0 || 
        currentQuestionIndex >= currentExam.questions.length) {
        console.error('Invalid question or exam state');
        return;
    }
    
    const question = currentExam.questions[currentQuestionIndex];
    if (!question) {
        console.error('Question not found at index:', currentQuestionIndex);
        return;
    }
    
    // Get elements directly from the DOM
    const questionNumber = document.getElementById('question-number');
    const currentQuestionEl = document.getElementById('current-question');
    const prevBtn = document.getElementById('prev-question');
    const nextBtn = document.getElementById('next-question');
    const markReviewBtn = document.getElementById('mark-review');
    
    // Make sure the elements exist
    if (!currentQuestionEl) return;
    
    // Update question number display
    if (questionNumber) {
        questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${currentExam.questions.length}`;
    }
    
    // Update mark for review button text based on current status
    if (markReviewBtn) {
        markReviewBtn.textContent = markedQuestions.includes(currentQuestionIndex) 
            ? 'Unmark for Review' 
            : 'Mark for Review';
    }
    
    // Show question text
    currentQuestionEl.innerHTML = `
        <div class="question-text">${question.question}</div>
        <div class="answer-section" id="answer-section"></div>
    `;
    
    const answerSection = document.getElementById('answer-section');
    if (!answerSection) return;
    
    // Display different input types based on question type
    if (question.type === 'mcq') {
        let optionsHTML = '';
        question.options.forEach((option, idx) => {
            const isSelected = userAnswers[currentQuestionIndex] === option;
            optionsHTML += `
                <div class="option ${isSelected ? 'selected' : ''}">
                    <input type="radio" name="answer" value="${option}" 
                           id="option-${idx}" ${isSelected ? 'checked' : ''}>
                    <label for="option-${idx}">${option}</label>
                </div>
            `;
        });
        answerSection.innerHTML = optionsHTML;
        
        // Add event listeners to radio buttons
        document.querySelectorAll('#answer-section input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                selectAnswer(currentQuestionIndex, this.value);
            });
        });
    } else if (question.type === 'truefalse') {
        const currentAnswer = userAnswers[currentQuestionIndex];
        answerSection.innerHTML = `
            <div class="option ${currentAnswer === 'true' ? 'selected' : ''}">
                <input type="radio" name="answer" value="true" 
                       id="option-true" ${currentAnswer === 'true' ? 'checked' : ''}>
                <label for="option-true">True</label>
            </div>
            <div class="option ${currentAnswer === 'false' ? 'selected' : ''}">
                <input type="radio" name="answer" value="false" 
                       id="option-false" ${currentAnswer === 'false' ? 'checked' : ''}>
                <label for="option-false">False</label>
            </div>
        `;
        
        // Add event listeners
        document.querySelectorAll('#answer-section input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                selectAnswer(currentQuestionIndex, this.value);
            });
        });
    } else if (question.type === 'written') {
        answerSection.innerHTML = `
            <textarea class="written-answer" 
                      placeholder="Type your answer here...">${userAnswers[currentQuestionIndex] || ''}</textarea>
        `;
        
        // Add event listener to textarea
        const textarea = document.querySelector('#answer-section textarea');
        if (textarea) {
            textarea.addEventListener('input', function() {
                selectAnswer(currentQuestionIndex, this.value);
            });
        }
    }
    
    // Update navigation buttons state
    if (prevBtn) {
        prevBtn.disabled = currentQuestionIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentQuestionIndex === currentExam.questions.length - 1;
    }
    
    // Update the navigation panel to reflect current question
    updateQuestionNavigationPanel();
}

function selectAnswer(questionIndex, answer) {
    console.log('selectAnswer called with index:', questionIndex, 'answer:', answer);
    
    if (!userAnswers) {
        console.log('userAnswers not initialized, creating new array');
        userAnswers = new Array(currentExam.questions.length).fill('');
    }
    
    userAnswers[questionIndex] = answer;
    
    // Add visual feedback for selection
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const selectedInput = document.querySelector(`input[name="answer"][value="${answer.replace(/"/g, '\\"')}"]`);
    if (selectedInput) {
        selectedInput.closest('.option').classList.add('selected');
    }
    
    // Update the navigation panel to reflect answered questions
    updateQuestionNavigationPanel();
    
    console.log('Updated userAnswers:', userAnswers);
}

function showNextQuestion() {
    if (currentQuestionIndex < currentExam.questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    }
}

function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

function markQuestionForReview() {
    const index = currentQuestionIndex;
    
    if (markedQuestions.includes(index)) {
        // If already marked, remove from marked questions
        markedQuestions = markedQuestions.filter(i => i !== index);
    } else {
        // If not marked, add to marked questions
        markedQuestions.push(index);
    }
    
    // Update the UI to reflect changes
    const markReviewBtn = document.getElementById('mark-review');
    if (markReviewBtn) {
        markReviewBtn.textContent = markedQuestions.includes(index) 
            ? 'Unmark for Review' 
            : 'Mark for Review';
    }
    
    // Update the navigation panel
    updateQuestionNavigationPanel();
}

async function submitExam() {
    try {
        if (!confirm('Are you sure you want to submit this exam? This action cannot be undone.')) {
            return;
        }

        // Verify the user has an active token before submitting
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Your session has expired. Please login again.');
            window.location.href = 'login.html';
            return;
        }

        // Gather all answers
        const finalAnswers = [];
        Object.keys(userAnswers).forEach(index => {
            finalAnswers[index] = userAnswers[index];
        });

        // Fill in blank answers
        for (let i = 0; i < currentExam.questions.length; i++) {
            if (finalAnswers[i] === undefined) {
                finalAnswers[i] = '';
            }
        }

        // Stop the timer
        clearInterval(timerInterval);
        const endTime = new Date();

        // Show loading state
        submitExamBtn.disabled = true;
        submitExamBtn.textContent = 'Submitting...';

        console.log('Submitting answers:', finalAnswers);
        console.log('Start time:', examStartTime);
        console.log('End time:', endTime);

        const response = await fetch(`/api/exams/${currentExam._id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                answers: finalAnswers,
                startTime: examStartTime
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error submitting exam');
        }

        const result = await response.json();
        console.log('Exam result:', result);

        // Reset exam state
        currentQuestionIndex = 0;
        userAnswers = {};
        
        // Show results
        showExamResults(result);
    } catch (error) {
        console.error('Error submitting exam:', error);
        alert(`Failed to submit exam: ${error.message}`);
        // Re-enable the submit button so user can try again
        submitExamBtn.disabled = false;
        submitExamBtn.textContent = 'Submit Exam';
        
        // Restart the timer if submission failed
        if (timerInterval === null) {
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
        }
    }
}

function showExamResults(result) {
    // Clear the exam section
    examSection.innerHTML = `
        <div class="exam-results">
            <h2>Exam Results</h2>
            <p>Score: ${result.score} out of ${result.totalQuestions}</p>
            <p>Percentage: ${((result.score / result.totalQuestions) * 100).toFixed(2)}%</p>
            <p>Time taken: ${formatTimeTaken(result.startTime, result.endTime)}</p>
            <button id="back-to-dashboard" class="btn">Back to Dashboard</button>
        </div>
    `;
    
    // Add click event for the back button
    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        // Reset exam state completely
        resetExamState();
        
        // Return to dashboard view
        userDashboard.classList.remove('hidden');
        examSection.classList.add('hidden');
        loadExams(); // Refresh the exams list
    });
}

// Function to completely reset the exam state
function resetExamState() {
    // Reset all exam-related global variables
    currentExam = null;
    currentQuestionIndex = 0;
    userAnswers = {};
    markedQuestions = [];
    examStartTime = null;
    examEndTime = null;
    
    // Clear timer if it's still running
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    console.log('Exam state has been reset');
}

function formatTimeTaken(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

// Admin Functions
function showAdminDashboard() {
    adminContent.innerHTML = `
        <div class="admin-welcome">
            <h3>Welcome, ${currentUser.username}!</h3>
            <p>You are logged in as an administrator.</p>
        </div>
        <div class="admin-stats">
            <div class="stat-card">
                <h4>Total Users</h4>
                <p id="total-users">Loading...</p>
            </div>
            <div class="stat-card">
                <h4>Total Exams</h4>
                <p id="total-exams">Loading...</p>
            </div>
        </div>
    `;
    
    // Load admin statistics
    loadAdminStats();
}

async function loadAdminStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('total-users').textContent = stats.totalUsers;
            document.getElementById('total-exams').textContent = stats.totalExams;
        } else {
            throw new Error('Failed to load statistics');
        }
    } catch (error) {
        console.error('Error loading admin stats:', error);
        document.getElementById('total-users').textContent = 'Error';
        document.getElementById('total-exams').textContent = 'Error';
    }
}

function showCreateExamForm() {
    adminContent.innerHTML = `
        <div class="create-exam-form">
            <h3>Create New Exam</h3>
            <form id="exam-form">
                <div class="form-group">
                    <label for="exam-title">Exam Title</label>
                    <input type="text" id="exam-title-input" required>
                </div>
                <div class="form-group">
                    <label for="exam-duration">Duration (minutes)</label>
                    <input type="number" id="exam-duration" min="1" required>
                </div>
                <div class="form-group">
                    <label for="exam-attempts">Attempts Allowed</label>
                    <input type="number" id="exam-attempts" min="1" value="1" required>
                </div>
                <div class="form-group">
                    <label for="exam-description">Description</label>
                    <textarea id="exam-description"></textarea>
                </div>
                <div id="questions-container">
                    <h4>Questions</h4>
                    <div id="questions-list"></div>
                    <button type="button" id="add-question">Add Question</button>
                </div>
                <button type="submit">Create Exam</button>
            </form>
        </div>
    `;

    document.getElementById('add-question').addEventListener('click', addQuestionForm);
    document.getElementById('exam-form').addEventListener('submit', handleCreateExam);
}

function addQuestionForm() {
    const questionsList = document.getElementById('questions-list');
    const questionIndex = questionsList.children.length;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-form';
    questionDiv.innerHTML = `
        <div class="form-group">
            <label>Question ${questionIndex + 1}</label>
            <input type="text" class="question-text" required>
        </div>
        <div class="form-group">
            <label>Question Type</label>
            <select class="question-type" required>
                <option value="mcq">Multiple Choice</option>
                <option value="truefalse">True/False</option>
                <option value="written">Written Answer</option>
            </select>
        </div>
        <div class="options-container"></div>
        <button type="button" class="remove-question">Remove Question</button>
    `;

    const typeSelect = questionDiv.querySelector('.question-type');
    typeSelect.addEventListener('change', (e) => updateQuestionOptions(e.target));
    
    questionDiv.querySelector('.remove-question').addEventListener('click', () => {
        questionDiv.remove();
        updateQuestionNumbers();
    });

    questionsList.appendChild(questionDiv);
    updateQuestionOptions(typeSelect);
}

function updateQuestionOptions(selectElement) {
    const optionsContainer = selectElement.closest('.question-form').querySelector('.options-container');
    const type = selectElement.value;
    
    if (type === 'mcq') {
        optionsContainer.innerHTML = `
            <div class="form-group">
                <label>Options (one per line)</label>
                <textarea class="mcq-options" required></textarea>
            </div>
            <div class="form-group">
                <label>Correct Answer</label>
                <input type="text" class="correct-answer" required>
            </div>
        `;
    } else if (type === 'truefalse') {
        optionsContainer.innerHTML = `
            <div class="form-group">
                <label>Correct Answer</label>
                <select class="correct-answer" required>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </div>
        `;
    } else {
        optionsContainer.innerHTML = `
            <div class="form-group">
                <label>Sample Answer</label>
                <textarea class="correct-answer"></textarea>
            </div>
        `;
    }
}

function updateQuestionNumbers() {
    const questions = document.querySelectorAll('.question-form');
    questions.forEach((question, index) => {
        question.querySelector('label').textContent = `Question ${index + 1}`;
    });
}

async function handleCreateExam(e) {
    e.preventDefault();
    
    const questions = Array.from(document.querySelectorAll('.question-form')).map(form => {
        const type = form.querySelector('.question-type').value;
        const text = form.querySelector('.question-text').value;
        const correctAnswer = form.querySelector('.correct-answer').value;
        
        const question = {
            question: text,
            type,
            correctAnswer
        };
        
        if (type === 'mcq') {
            question.options = form.querySelector('.mcq-options').value.split('\n').filter(opt => opt.trim());
        }
        
        return question;
    });

    const examData = {
        title: document.getElementById('exam-title-input').value,
        duration: parseInt(document.getElementById('exam-duration').value),
        attemptsAllowed: parseInt(document.getElementById('exam-attempts').value),
        description: document.getElementById('exam-description').value,
        questions
    };

    try {
        const response = await fetch('/api/admin/exams', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(examData)
        });

        if (response.ok) {
            alert('Exam created successfully!');
            showAdminDashboard();
        } else {
            const data = await response.json();
            alert(data.message || 'Error creating exam');
        }
    } catch (error) {
        console.error('Error creating exam:', error);
        alert('Error creating exam');
    }
}

async function showUsersList() {
    adminContent.innerHTML = `
        <div class="users-list">
            <h3>Users</h3>
            <div class="loading">Loading users...</div>
        </div>
    `;

    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const users = await response.json();
            const usersContainer = document.createElement('div');
            usersContainer.className = 'users-list';
            
            usersContainer.innerHTML = `
                <h3>Users</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.username}</td>
                                <td>${user.role}</td>
                                <td>
                                    <button class="view-user-exams-btn" data-user-id="${user._id}">View Exams</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            adminContent.innerHTML = '';
            adminContent.appendChild(usersContainer);
            
            // Add back button
            createBackButton(usersContainer, 'Back to Dashboard', showAdminDashboard);
            
            // Add event listeners to view exams buttons
            document.querySelectorAll('.view-user-exams-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    viewUserExams(userId);
                });
            });
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        adminContent.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Users</h3>
                <p>${error.message}</p>
            </div>
        `;
        
        // Add back button with proper event listener
        createBackButton(adminContent.querySelector('.error-message'), 'Back to Dashboard', showAdminDashboard);
    }
}

// Function to view a user's exam attempts
async function viewUserExams(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/exams`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const attempts = await response.json();
            const container = document.createElement('div');
            container.className = 'user-exams';
            
            container.innerHTML = `
                <h3>User Exam Attempts</h3>
                ${attempts.length === 0 ? '<p>No exam attempts found for this user.</p>' : 
                `<table>
                    <thead>
                        <tr>
                            <th>Exam</th>
                            <th>Score</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attempts.map(attempt => `
                            <tr>
                                <td>${attempt.exam.title}</td>
                                <td>${attempt.score} / ${attempt.totalQuestions}</td>
                                <td>${new Date(attempt.submittedAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`
                }
            `;
            
            adminContent.innerHTML = '';
            adminContent.appendChild(container);
            
            // Add back button
            createBackButton(container, 'Back to Users List', showUsersList);
        } else {
            throw new Error('Failed to load user exam attempts');
        }
    } catch (error) {
        console.error('Error loading user exam attempts:', error);
        alert('Error loading user exam attempts');
    }
}

// Admin dashboard back buttons
function createBackButton(container, text, clickHandler) {
    const button = document.createElement('button');
    button.textContent = text || 'Back to Dashboard';
    button.className = 'back-btn';
    button.addEventListener('click', clickHandler);
    container.appendChild(button);
    return button;
}

async function showAdminExamResults() {
    adminContent.innerHTML = `
        <div class="exam-results">
            <h3>Exam Results</h3>
            <div class="loading">Loading exams...</div>
        </div>
    `;

    try {
        const response = await fetch('/api/admin/exams', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load exams');
        }

        const exams = await response.json();
        
        // Create container first
        adminContent.innerHTML = `
            <div class="exam-results">
                <h3>Exam Results</h3>
                <div class="exams-list">
                    ${exams.map(exam => `
                        <div class="exam-card">
                            <h4>${exam.title}</h4>
                            <p>${exam.description || ''}</p>
                            <div class="exam-actions">
                                <button class="view-results-btn" data-exam-id="${exam._id}">View Results</button>
                                <button class="edit-exam-btn" data-exam-id="${exam._id}">Edit Exam</button>
                                <button class="delete-exam-btn" data-exam-id="${exam._id}">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners after the HTML has been inserted
        document.querySelectorAll('.view-results-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const examId = e.target.dataset.examId;
                if (examId) {
                    viewExamResults(examId);
                }
            });
        });

        document.querySelectorAll('.edit-exam-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const examId = e.target.dataset.examId;
                if (examId) {
                    editExam(examId);
                }
            });
        });

        document.querySelectorAll('.delete-exam-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const examId = e.target.dataset.examId;
                if (examId) {
                    deleteExam(examId);
                }
            });
        });
    } catch (error) {
        console.error('Error loading exam results:', error);
        adminContent.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Exams</h3>
                <p>${error.message}</p>
            </div>
        `;
        
        // Add back button with proper event listener
        createBackButton(adminContent.querySelector('.error-message'), 'Back to Dashboard', showAdminDashboard);
    }
}

async function viewExamResults(examId) {
    try {
        const response = await fetch(`/api/admin/exams/${examId}/results`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const results = await response.json();
            const resultsContainer = document.createElement('div');
            resultsContainer.className = 'exam-results-detail';
            
            resultsContainer.innerHTML = `
                <h3>Exam Results</h3>
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Score</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(result => `
                            <tr>
                                <td>${result.username}</td>
                                <td>${result.score || 'Not completed'}</td>
                                <td>${new Date(result.startTime).toLocaleString()}</td>
                                <td>${result.endTime ? new Date(result.endTime).toLocaleString() : 'In progress'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            adminContent.innerHTML = '';
            adminContent.appendChild(resultsContainer);
            
            // Add back button with proper event listener
            createBackButton(resultsContainer, 'Back to Exams', showAdminExamResults);
        } else {
            throw new Error('Failed to load exam results');
        }
    } catch (error) {
        console.error('Error loading exam results:', error);
        alert('Error loading exam results');
    }
}

// Function to handle editing an exam (not fully implemented in the original code)
async function editExam(examId) {
    try {
        const response = await fetch(`/api/admin/exams/${examId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const exam = await response.json();
            showEditExamForm(exam);
        } else {
            throw new Error('Failed to load exam details');
        }
    } catch (error) {
        console.error('Error loading exam for editing:', error);
        alert('Error loading exam details');
    }
}

function showEditExamForm(exam) {
    adminContent.innerHTML = `
        <div class="create-exam-form">
            <h3>Edit Exam</h3>
            <form id="exam-form">
                <div class="form-group">
                    <label for="exam-title">Exam Title</label>
                    <input type="text" id="exam-title-input" value="${exam.title}" required>
                </div>
                <div class="form-group">
                    <label for="exam-duration">Duration (minutes)</label>
                    <input type="number" id="exam-duration" value="${exam.duration}" min="1" required>
                </div>
                <div class="form-group">
                    <label for="exam-attempts">Attempts Allowed</label>
                    <input type="number" id="exam-attempts" value="${exam.attemptsAllowed}" min="1" required>
                </div>
                <div class="form-group">
                    <label for="exam-description">Description</label>
                    <textarea id="exam-description">${exam.description || ''}</textarea>
                </div>
                <div id="questions-container">
                    <h4>Questions</h4>
                    <div id="questions-list">
                        ${exam.questions.map((question, index) => `
                            <div class="question-form">
                                <div class="form-group">
                                    <label>Question ${index + 1}</label>
                                    <input type="text" class="question-text" value="${question.question}" required>
                                </div>
                                <div class="form-group">
                                    <label>Question Type</label>
                                    <select class="question-type" required>
                                        <option value="mcq" ${question.type === 'mcq' ? 'selected' : ''}>Multiple Choice</option>
                                        <option value="truefalse" ${question.type === 'truefalse' ? 'selected' : ''}>True/False</option>
                                        <option value="written" ${question.type === 'written' ? 'selected' : ''}>Written Answer</option>
                                    </select>
                                </div>
                                <div class="options-container">
                                    ${getQuestionOptionsHTML(question)}
                                </div>
                                <button type="button" class="remove-question">Remove Question</button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" id="add-question">Add Question</button>
                </div>
                <div class="form-actions">
                    <button type="submit">Update Exam</button>
                    <button type="button" id="back-button">Cancel</button>
                </div>
            </form>
        </div>
    `;

    // Add event listeners for question type changes
    document.querySelectorAll('.question-type').forEach(select => {
        select.addEventListener('change', (e) => updateQuestionOptions(e.target));
    });

    // Add event listeners for remove question buttons
    document.querySelectorAll('.remove-question').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.question-form').remove();
            updateQuestionNumbers();
        });
    });

    document.getElementById('add-question').addEventListener('click', addQuestionForm);
    document.getElementById('exam-form').addEventListener('submit', (e) => handleUpdateExam(e, exam._id));
    document.getElementById('back-button').addEventListener('click', showAdminExamResults);
}

function getQuestionOptionsHTML(question) {
    if (question.type === 'mcq') {
        return `
            <div class="form-group">
                <label>Options (one per line)</label>
                <textarea class="mcq-options" required>${question.options.join('\n')}</textarea>
            </div>
            <div class="form-group">
                <label>Correct Answer</label>
                <input type="text" class="correct-answer" value="${question.correctAnswer}" required>
            </div>
        `;
    } else if (question.type === 'truefalse') {
        return `
            <div class="form-group">
                <label>Correct Answer</label>
                <select class="correct-answer" required>
                    <option value="true" ${question.correctAnswer === 'true' ? 'selected' : ''}>True</option>
                    <option value="false" ${question.correctAnswer === 'false' ? 'selected' : ''}>False</option>
                </select>
            </div>
        `;
    } else {
        return `
            <div class="form-group">
                <label>Sample Answer</label>
                <textarea class="correct-answer">${question.correctAnswer || ''}</textarea>
            </div>
        `;
    }
}

async function handleUpdateExam(e, examId) {
    e.preventDefault();
    
    const questions = Array.from(document.querySelectorAll('.question-form')).map(form => {
        const type = form.querySelector('.question-type').value;
        const text = form.querySelector('.question-text').value;
        const correctAnswer = form.querySelector('.correct-answer').value;
        
        const question = {
            question: text,
            type,
            correctAnswer
        };
        
        if (type === 'mcq') {
            question.options = form.querySelector('.mcq-options').value.split('\n').filter(opt => opt.trim());
        }
        
        return question;
    });

    const examData = {
        title: document.getElementById('exam-title-input').value,
        duration: parseInt(document.getElementById('exam-duration').value),
        attemptsAllowed: parseInt(document.getElementById('exam-attempts').value),
        description: document.getElementById('exam-description').value,
        questions
    };

    try {
        const response = await fetch(`/api/admin/exams/${examId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(examData)
        });

        if (response.ok) {
            alert('Exam updated successfully!');
            showAdminExamResults();
        } else {
            const data = await response.json();
            alert(data.message || 'Error updating exam');
        }
    } catch (error) {
        console.error('Error updating exam:', error);
        alert('Error updating exam');
    }
}

async function deleteExam(examId) {
    if (!confirm('Are you sure you want to delete this exam?')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/exams/${examId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            alert('Exam deleted successfully!');
            showAdminExamResults();
        } else {
            const data = await response.json();
            alert(data.message || 'Error deleting exam');
        }
    } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Error deleting exam');
    }
}

// Check for existing session
document.addEventListener('DOMContentLoaded', () => {
    // Only run this on the dashboard page
    if (window.location.pathname.endsWith('index.html')) {
        const token = localStorage.getItem('token');
        if (token) {
            // Verify token and load user data
            fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Token verification failed');
                }
                return response.json();
            })
            .then(data => {
                if (data.user) {
                    currentUser = data.user;
                    showDashboard();
                } else {
                    throw new Error('No user data received');
                }
            })
            .catch(error => {
                console.error('Session verification error:', error);
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            });
        } else {
            window.location.href = 'login.html';
        }
    }
});

// Add logout function
async function handleLogout() {
    try {
        // Call logout endpoint
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        // Reset all exam state
        resetExamState();
        
        // Clear local storage and reset user state
        localStorage.removeItem('token');
        currentUser = null;
        
        // Redirect to login page
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        // Even if the server request fails, we should still clean up and redirect
        resetExamState();
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Add event listeners for exam buttons
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for start exam buttons
    document.querySelectorAll('.start-exam-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const examId = e.target.dataset.examId;
            if (examId) {
                startExam(examId);
            }
        });
    });

    // Add event listeners for edit exam buttons
    document.querySelectorAll('.edit-exam-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const examId = e.target.dataset.examId;
            if (examId) {
                editExam(examId);
            }
        });
    });
});

function updateQuestionNavigationPanel() {
    const navButtons = document.getElementById('question-nav-buttons');
    if (!navButtons || !currentExam || !currentExam.questions) return;
    
    navButtons.innerHTML = '';
    
    currentExam.questions.forEach((question, index) => {
        const button = document.createElement('button');
        button.textContent = index + 1;
        button.className = 'question-nav-btn';
        
        // Add appropriate classes based on status
        if (index === currentQuestionIndex) {
            button.classList.add('current');
        }
        if (userAnswers[index] !== undefined && userAnswers[index] !== '') {
            button.classList.add('answered');
        }
        if (markedQuestions.includes(index)) {
            button.classList.add('marked');
        }
        
        button.addEventListener('click', () => {
            currentQuestionIndex = index;
            showQuestion();
        });
        
        navButtons.appendChild(button);
    });
}

function backToHistory() {
    attemptDetailsSection.classList.add('hidden');
    userDashboard.classList.remove('hidden');
    setActiveTab(examHistoryTab, examHistoryContent);
} 