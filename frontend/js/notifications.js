/**
 * Notification Service
 * Handles notification-related operations like fetching and managing notifications
 */
class NotificationService {
    constructor() {
        this.unreadCount = 0;
        this.notifications = [];
        this.lastFetchTime = null;
    }
    
    /**
     * Get user notifications
     * @param {string} filter - Filter notifications (all, read, unread)
     * @returns {Promise} - Promise resolving to array of notifications
     */
    async getNotifications(filter = 'all') {
        try {
            let url = `${CONFIG.API_URL}/api/notifications`;
            
            if (filter !== 'all') {
                url += `?readStatus=${filter === 'read'}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            
            const data = await response.json();
            this.notifications = data.notifications || [];
            this.updateUnreadCount();
            this.lastFetchTime = new Date();
            
            return this.notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }
    
    /**
     * Mark a notification as read
     * @param {string} notificationId - Notification ID
     * @returns {Promise} - Promise resolving when notification is marked as read
     */
    async markAsRead(notificationId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }
            
            // Update local notification
            const notification = this.notifications.find(n => n.NotificationID === notificationId);
            if (notification) {
                notification.ReadStatus = true;
                this.updateUnreadCount();
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error marking notification ${notificationId} as read:`, error);
            throw error;
        }
    }
    
    /**
     * Mark all notifications as read
     * @returns {Promise} - Promise resolving when all notifications are marked as read
     */
    async markAllAsRead() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to mark all notifications as read');
            }
            
            // Update local notifications
            this.notifications.forEach(notification => {
                notification.ReadStatus = true;
            });
            
            this.updateUnreadCount();
            return await response.json();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
    
    /**
     * Update notification preferences
     * @param {Object} preferences - Notification preferences
     * @returns {Promise} - Promise resolving when preferences are updated
     */
    async updatePreferences(preferences) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/notifications/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify(preferences)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update notification preferences');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }
    
    /**
     * Update the unread notification count
     */
    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.ReadStatus).length;
        this.updateBadge();
    }
    
    /**
     * Update the notification badge in the UI
     */
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    /**
     * Start polling for new notifications
     */
    startPolling() {
        // Clear any existing polling
        this.stopPolling();
        
        // Set up new polling interval
        this.pollingInterval = setInterval(async () => {
            if (authService.isAuthenticated()) {
                try {
                    await this.getNotifications();
                } catch (error) {
                    console.error('Error polling notifications:', error);
                }
            } else {
                this.stopPolling();
            }
        }, CONFIG.REFRESH.NOTIFICATIONS);
    }
    
    /**
     * Stop polling for notifications
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    
    /**
     * Format notification time
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted time string
     */
    formatNotificationTime(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', CONFIG.DATE_FORMAT.DISPLAY);
        }
    }
    
    /**
     * Get notification type display text
     * @param {string} type - Notification type
     * @returns {string} - Display text
     */
    getNotificationTypeText(type) {
        switch (type) {
            case CONFIG.NOTIFICATION_TYPES.TASK_ASSIGNED:
                return 'Task Assigned';
            case CONFIG.NOTIFICATION_TYPES.DEADLINE_REMINDER:
                return 'Deadline Reminder';
            case CONFIG.NOTIFICATION_TYPES.STATUS_UPDATE:
                return 'Status Update';
            default:
                return 'Notification';
        }
    }
}

// Create and export notification service instance
const notificationService = new NotificationService();