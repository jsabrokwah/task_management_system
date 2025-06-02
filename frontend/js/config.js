/**
 * Configuration settings for the Task Management System
 */
const CONFIG = {
    // API endpoint base URL - replace with your actual API Gateway URL in production
    API_URL: 'https://o8v094rm2e.execute-api.eu-west-1.amazonaws.com/dev/',
    
    // Authentication settings
    AUTH: {
        TOKEN_KEY: 'tms_token',
        USER_KEY: 'tms_user',
        REFRESH_INTERVAL: 1800000 // 30 minutes in milliseconds
    },
    
    // Task status options
    TASK_STATUS: {
        NEW: 'New',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed',
        OVERDUE: 'Overdue'
    },
    
    // Task priority options
    TASK_PRIORITY: {
        LOW: 'Low',
        MEDIUM: 'Medium',
        HIGH: 'High'
    },
    
    // User roles
    USER_ROLES: {
        ADMIN: 'admin',
        TEAM_MEMBER: 'team_member'
    },
    
    // Notification types
    NOTIFICATION_TYPES: {
        TASK_ASSIGNED: 'task_assigned',
        DEADLINE_REMINDER: 'deadline_reminder',
        STATUS_UPDATE: 'status_update'
    },
    
    // Date format options
    DATE_FORMAT: {
        DISPLAY: { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        },
        SHORT: { 
            month: 'short', 
            day: 'numeric' 
        }
    },
    
    // Refresh intervals
    REFRESH: {
        DASHBOARD: 300000, // 5 minutes
        TASKS: 60000,      // 1 minute
        NOTIFICATIONS: 30000 // 30 seconds
    }
};