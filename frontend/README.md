# Task Management System - Frontend

This directory contains the frontend code for the Task Management System.

## Structure

- `index.html` - Main application page
- `login.html` - Standalone login page
- `css/` - Stylesheets
  - `styles.css` - Main stylesheet
  - `responsive.css` - Responsive design styles
- `js/` - JavaScript files
  - `config.js` - Configuration settings
  - `mock-api.js` - Mock API for development
  - `auth.js` - Authentication service
  - `tasks.js` - Task management service
  - `notifications.js` - Notification service
  - `profile.js` - User profile service
  - `admin.js` - Admin dashboard service
  - `app.js` - Main application logic
  - `app-tasks.js` - Task-specific UI functionality
  - `app-notifications.js` - Notification-specific UI functionality
  - `app-profile.js` - Profile-specific UI functionality
  - `app-init.js` - Application initialization
- `images/` - Image assets

## Development

During development, the frontend uses a mock API implementation to simulate backend functionality. This allows for frontend development to proceed independently of the backend implementation.

To switch to the real API:
1. Set `MOCK_API_ENABLED = false` in `mock-api.js`
2. Update the `API_URL` in `config.js` to point to your actual API endpoint

## Features

- User authentication (login/register)
- Dashboard with task statistics
- Task management (create, view, edit, delete)
- Task filtering and searching
- Notifications system
- User profile management
- Admin dashboard with team performance metrics

## Responsive Design

The frontend is designed to be responsive and work well on devices of all sizes, from mobile phones to desktop computers.