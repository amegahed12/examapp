# Simple Exam Web App

A minimal yet functional web application for taking and managing online exams.

## Features

### User Features
- User registration and login
- View available exams
- Take exams with different question types (MCQ, written answer, True/False)
- Timer for exam duration
- Navigation between questions
- Mark questions for review
- Submit exam for evaluation

### Admin Features
- Admin login panel
- Create and manage exams
- Add, edit, or delete questions
- View user exam attempts and results

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js with Express
- Database: MongoDB

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/examapp
# IMPORTANT: Generate a strong random string for JWT_SECRET
# You can use this command to generate one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-secure-jwt-secret-key-here
NODE_ENV=development
```

3. Start MongoDB server

4. Run the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

5. Default admin setup:
   - Register a new user
   - Use MongoDB commands to change the role to 'admin'
   - Example with MongoDB shell:
     ```
     db.users.updateOne({username: "youradminusername"}, {$set: {role: "admin"}})
     ```

## Usage

1. Access the application at `http://localhost:8080`
2. Register a new user account or login
3. As a regular user:
   - View available exams
   - Start an exam
   - Answer questions
   - Submit the exam
4. As an admin:
   - Create new exams
   - Manage questions
   - View user results

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/verify` - Verify JWT token

### Exams
- GET `/api/exams` - Get all active exams
- GET `/api/exams/:id` - Get specific exam
- GET `/api/exams/:id/attempts` - Get user's attempts for a specific exam
- POST `/api/exams/:id/start` - Start an exam
- POST `/api/exams/:id/submit` - Submit exam answers

### Admin
- POST `/api/admin/exams` - Create new exam
- PUT `/api/admin/exams/:id` - Update exam
- DELETE `/api/admin/exams/:id` - Delete exam
- GET `/api/admin/users` - Get all users
- GET `/api/admin/users/:userId/exams` - Get user exam attempts
- GET `/api/admin/exams/:examId/results` - Get exam results
- GET `/api/admin/stats` - Get admin statistics
- GET `/api/admin/exams` - Get all exams (including inactive) 