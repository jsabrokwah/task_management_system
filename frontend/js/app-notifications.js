/**
 * Notifications UI
 * Handles notification-specific UI functionality
 */

// DOM Elements
const notificationElements = {
    notificationsList: document.getElementById('notifications-list'),
    notificationFilter: document.getElementById('notification-filter'),
    markAllReadBtn: document.getElementById('mark-all-read')
};

// Current notifications data
let notificationsData = [];

/**
 * Initialize notifications
 */
function initNotifications() {
    // Set up event listeners
    setupNotificationEventListeners();
}

/**
 * Set up notification-related event listeners
 */
function setupNotificationEventListeners() {
    // Notification filter
    notificationElements.notificationFilter.addEventListener('change', filterNotifications);
    
    // Mark all as read button
    notificationElements.markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
}

/**
 * Refresh notifications data and display
 */
async function refreshNotifications() {
    try {
        showLoading();
        
        // Get all notifications
        notificationsData = await notificationsService.getNotifications();
        
        // Display notifications
        displayNotifications(notificationsData);
        
        // Update notification badge
        updateNotificationBadge();
        
        hideLoading();
    } catch (error) {
        console.error('Error refreshing notifications:', error);
        hideLoading();
    }
}

/**
 * Display notifications in the list
 * @param {Array} notifications - Notifications to display
 */
function displayNotifications(notifications) {
    const list = notificationElements.notificationsList;
    list.innerHTML = '';
    
    if (notifications.length === 0) {
        list.innerHTML = '<p>No notifications found.</p>';
        return;
    }
    
    // Sort notifications by date (newest first)
    notifications.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    
    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.ReadStatus ? '' : 'unread'}`;
        item.dataset.id = notification.NotificationID;
        
        const createdAt = new Date(notification.CreatedAt);
        const formattedDate = formatDate(notification.CreatedAt);
        
        // Determine notification type icon
        let typeIcon = '';
        switch (notification.Type) {
            case 'task_assigned':
                typeIcon = '<i class="fas fa-tasks"></i>';
                break;
            case 'deadline_reminder':
                typeIcon = '<i class="fas fa-clock"></i>';
                break;
            case 'status_update':
                typeIcon = '<i class="fas fa-sync-alt"></i>';
                break;
            default:
                typeIcon = '<i class="fas fa-bell"></i>';
        }
        
        item.innerHTML = `
            <div class="notification-header">
                <span class="notification-type">${typeIcon} ${formatNotificationType(notification.Type)}</span>
                <span class="notification-time">${formattedDate}</span>
            </div>
            <div class="notification-message">${notification.Message}</div>
            <div class="notification-actions">
                ${notification.ReadStatus ? '' : '<button class="btn btn-outline mark-read-btn">Mark as Read</button>'}
                ${notification.TaskID ? '<button class="btn btn-outline view-task-btn">View Task</button>' : ''}
            </div>
        `;
        
        // Add event listeners to buttons
        const markReadBtn = item.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
                markNotificationAsRead(notification.NotificationID);
            });
        }
        
        const viewTaskBtn = item.querySelector('.view-task-btn');
        if (viewTaskBtn) {
            viewTaskBtn.addEventListener('click', () => {
                viewNotificationTask(notification.TaskID);
            });
        }
        
        list.appendChild(item);
    });
}

/**
 * Format notification type for display
 * @param {string} type - Notification type
 * @returns {string} - Formatted notification type
 */
function formatNotificationType(type) {
    switch (type) {
        case 'task_assigned':
            return 'Task Assigned';
        case 'deadline_reminder':
            return 'Deadline Reminder';
        case 'status_update':
            return 'Status Update';
        default:
            return 'Notification';
    }
}

/**
 * Filter notifications based on selected filter
 */
function filterNotifications() {
    const filterValue = notificationElements.notificationFilter.value;
    
    // Apply filter
    let filteredNotifications = notificationsData;
    
    if (filterValue === 'unread') {
        filteredNotifications = notificationsData.filter(notification => !notification.ReadStatus);
    } else if (filterValue === 'read') {
        filteredNotifications = notificationsData.filter(notification => notification.ReadStatus);
    }
    
    // Display filtered notifications
    displayNotifications(filteredNotifications);
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
async function markNotificationAsRead(notificationId) {
    try {
        showLoading();
        
        // Mark notification as read
        await notificationsService.markAsRead(notificationId);
        
        // Update notification in data
        const notification = notificationsData.find(n => n.NotificationID === notificationId);
        if (notification) {
            notification.ReadStatus = true;
        }
        
        // Refresh display
        displayNotifications(notificationsData);
        
        // Update notification badge
        updateNotificationBadge();
        
        hideLoading();
    } catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
        hideLoading();
    }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead() {
    try {
        showLoading();
        
        // Mark all notifications as read
        await notificationsService.markAllAsRead();
        
        // Update all notifications in data
        notificationsData.forEach(notification => {
            notification.ReadStatus = true;
        });
        
        // Refresh display
        displayNotifications(notificationsData);
        
        // Update notification badge
        updateNotificationBadge();
        
        hideLoading();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        hideLoading();
    }
}

/**
 * View task associated with notification
 * @param {string} taskId - Task ID
 */
function viewNotificationTask(taskId) {
    // Navigate to tasks page with task ID parameter
    window.location.href = `tasks.html?taskId=${taskId}`;
}

// Initialize notifications when app is ready
document.addEventListener('app-ready', initNotifications);