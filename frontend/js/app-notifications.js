/**
 * Notifications UI Functions
 * Extension of app.js for notification-related UI functionality
 */

// Load notifications data
async function loadNotifications() {
    try {
        showLoading();
        
        // Get filter value
        const filter = document.getElementById('notification-filter').value;
        
        // Get notifications
        const notifications = await notificationService.getNotifications(filter);
        
        // Display notifications
        displayNotifications(notifications);
        
        hideLoading();
    } catch (error) {
        console.error('Error loading notifications:', error);
        hideLoading();
        showError('Failed to load notifications');
    }
}

// Display notifications in the UI
function displayNotifications(notifications) {
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="text-center">No notifications</p>';
        return;
    }
    
    // Sort notifications by date (newest first)
    notifications.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    
    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.ReadStatus ? '' : 'unread'}`;
        notificationItem.setAttribute('data-notification-id', notification.NotificationID);
        
        notificationItem.innerHTML = `
            <div class="notification-header">
                <span class="notification-type">${notificationService.getNotificationTypeText(notification.Type)}</span>
                <span class="notification-time">${notificationService.formatNotificationTime(notification.CreatedAt)}</span>
            </div>
            <div class="notification-message">${notification.Message}</div>
            <div class="notification-actions">
                ${notification.ReadStatus ? '' : '<button class="btn btn-outline mark-read-btn">Mark as Read</button>'}
                ${notification.TaskID ? `<button class="btn btn-outline view-task-btn" data-task-id="${notification.TaskID}">View Task</button>` : ''}
            </div>
        `;
        
        notificationsList.appendChild(notificationItem);
    });
    
    // Add event listeners to notification action buttons
    document.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const notificationId = e.target.closest('.notification-item').getAttribute('data-notification-id');
            markNotificationAsRead(notificationId);
        });
    });
    
    document.querySelectorAll('.view-task-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            
            // Hide notifications container
            elements.notificationsContainer.classList.add('hidden');
            
            // Show tasks container
            elements.tasksContainer.classList.remove('hidden');
            
            // Update active nav link
            elements.navLinks.forEach(link => link.classList.remove('active'));
            elements.tasksLink.classList.add('active');
            
            // Show task details
            showTaskDetails(taskId);
        });
    });
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    try {
        showLoading();
        
        await notificationService.markAsRead(notificationId);
        
        // Update UI
        const notificationItem = document.querySelector(`.notification-item[data-notification-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.classList.remove('unread');
            const markReadBtn = notificationItem.querySelector('.mark-read-btn');
            if (markReadBtn) {
                markReadBtn.remove();
            }
        }
        
        hideLoading();
    } catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
        hideLoading();
        showError('Failed to mark notification as read');
    }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
    try {
        showLoading();
        
        await notificationService.markAllAsRead();
        
        // Reload notifications
        await loadNotifications();
        
        hideLoading();
        showMessage('All notifications marked as read');
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        hideLoading();
        showError('Failed to mark all notifications as read');
    }
}

// Initialize notification-related event listeners
function initNotificationEvents() {
    // Mark all as read button
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    }
    
    // Notification filter
    const notificationFilter = document.getElementById('notification-filter');
    if (notificationFilter) {
        notificationFilter.addEventListener('change', loadNotifications);
    }
}