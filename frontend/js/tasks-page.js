/**
 * Tasks Page Specific JavaScript
 * Handles tasks page initialization and URL parameter handling
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!authService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update user info
    const user = authService.getUser();
    document.getElementById('user-name').textContent = user.name || user.username || user.email;
    
    // Show/hide admin sections
    toggleAdminSections();
    
    // Load tasks data
    refreshTasks().then(() => {
        // Check if there's a task ID in the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('taskId');
        
        if (taskId) {
            // View the specified task
            setTimeout(() => {
                viewTask(taskId);
            }, 500);
        }
    });
    
    // Start notification polling
    startNotificationPolling();
    
    // Set up logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        authService.logout();
    });
    
    // Initialize tasks functionality
    initTasks();
});