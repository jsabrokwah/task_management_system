/**
 * Common Utility Functions
 * Shared functionality across all pages
 */

// Show loading spinner
function showLoading() {
    document.getElementById('loading-spinner').classList.remove('hidden');
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loading-spinner').classList.add('hidden');
}

// Toggle admin sections based on user role
function toggleAdminSections() {
    const isAdmin = authService.isAdmin();
    document.querySelectorAll('.admin-section').forEach(section => {
        if (isAdmin) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

// Start notification polling
function startNotificationPolling() {
    // Check for unread notifications immediately
    updateNotificationBadge();
    
    // Set up polling interval
    setInterval(() => {
        updateNotificationBadge();
    }, CONFIG.REFRESH.NOTIFICATIONS);
}

// Update notification badge with unread count
async function updateNotificationBadge() {
    try {
        const count = await notificationsService.getUnreadCount();
        
        if (count > 0) {
            document.getElementById('notification-badge').textContent = count;
            document.getElementById('notification-badge').classList.remove('hidden');
        } else {
            document.getElementById('notification-badge').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
}

// Format date for display
function formatDate(dateString, options = CONFIG.DATE_FORMAT.DISPLAY) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', options);
}