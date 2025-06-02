# Task Management System Backend

This directory contains the backend implementation for the Task Management System, built using Flask and AWS serverless services.

## Directory Structure

- `admin/`: Admin dashboard API endpoints
- `auth/`: Authentication API endpoints
- `common/`: Shared utilities and helpers
- `notifications/`: Notification system API endpoints
- `tasks/`: Task management API endpoints

## Setup and Deployment

### Local Development

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export USERS_TABLE=Users-dev
export TASKS_TABLE=Tasks-dev
export NOTIFICATIONS_TABLE=Notifications-dev
export USER_POOL_ID=your-user-pool-id
export USER_POOL_CLIENT_ID=your-user-pool-client-id
export NOTIFICATION_TOPIC=your-sns-topic-arn
```

### AWS Deployment

The backend is deployed using AWS SAM. See the root directory's README for deployment instructions.

## API Endpoints

### Authentication

- `POST /auth/register`: Register a new user
- `POST /auth/login`: User login
- `GET /auth/profile`: Get user profile
- `PUT /auth/profile`: Update user profile

### Tasks

- `GET /tasks`: List tasks (filtered by user role)
- `POST /tasks`: Create a new task
- `GET /tasks/{taskId}`: Get task details
- `PUT /tasks/{taskId}`: Update task
- `DELETE /tasks/{taskId}`: Delete task
- `PUT /tasks/{taskId}/status`: Update task status
- `PUT /tasks/{taskId}/assign`: Assign task to user

### Notifications

- `GET /notifications`: Get user notifications
- `PUT /notifications/{notificationId}/read`: Mark notification as read
- `PUT /notifications/settings`: Update notification preferences

### Admin

- `GET /admin/users`: List all users
- `GET /admin/tasks/overview`: Get task statistics
- `GET /admin/tasks/deadlines`: Get upcoming deadlines
- `GET /admin/performance`: Get team performance metrics

## Lambda Functions

- `AuthFunction`: Handles authentication endpoints
- `TasksFunction`: Handles task management endpoints
- `NotificationsFunction`: Handles notification endpoints
- `DeadlineReminderFunction`: Sends reminders for upcoming deadlines
- `AdminFunction`: Handles admin dashboard endpoints

## Testing

To run tests:
```bash
cd ../tests
pytest
```