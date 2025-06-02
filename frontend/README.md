# Task Management System - Frontend

This directory contains the frontend code for the Task Management System.

## Overview

The frontend is built using vanilla HTML, CSS, and JavaScript without any frameworks, as per the project requirements. It provides a responsive user interface for managing tasks, notifications, and user profiles.

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

## Features

- User authentication (login/register)
- Dashboard with task statistics
- Task management (create, view, edit, delete)
- Task filtering and searching
- Notifications system
- User profile management
- Admin dashboard with team performance metrics

## Development

### Local Development

1. Configure the API URL in `js/config.js` to point to your backend API
2. For development without a backend, enable the mock API in `js/mock-api.js`
3. Open `index.html` in a web browser

### Mock API

The frontend includes a mock API implementation for development and testing without a backend. To use it:

1. Set `MOCK_API_ENABLED = true` in `js/mock-api.js`
2. The mock API will intercept all fetch requests to the configured API URL

### Production Deployment

1. Set `MOCK_API_ENABLED = false` in `js/mock-api.js`
2. Update the `API_URL` in `js/config.js` to point to your actual API endpoint
3. Deploy the frontend files to an S3 bucket or other hosting service

## Responsive Design

The frontend is designed to be responsive and work well on devices of all sizes:

- Desktop: Full layout with sidebar navigation
- Tablet: Adjusted layout with some stacked elements
- Mobile: Fully stacked layout with optimized navigation

## Browser Compatibility

The frontend is compatible with modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- Font Awesome (6.0.0-beta3) - For icons
- Chart.js - For dashboard charts