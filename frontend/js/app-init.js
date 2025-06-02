/**
 * Application Initialization
 * Connects all the separate modules and initializes the application
 */

// Initialize all event listeners
function initAllEvents() {
    // Initialize task events
    initTaskEvents();
    
    // Initialize notification events
    initNotificationEvents();
    
    // Initialize profile events
    initProfileEvents();
}

// Document ready function
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();
    
    // Initialize all event listeners
    initAllEvents();
});