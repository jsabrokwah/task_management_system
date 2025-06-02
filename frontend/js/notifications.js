/**
 * Notifications Service
 * Handles notification operations
 */
class NotificationsService {
    /**
     * Get all notifications for the current user
     * @param {Object} filters - Optional filters for notifications
     * @returns {Promise} - Promise resolving to array of notifications
     */
    async getNotifications(filters = {}) {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            if (filters.read !== undefined) queryParams.append('read', filters.read);
            if (filters.limit) queryParams.append('limit', filters.limit);
            
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            
            const response = await fetch(`${CONFIG.API_URL}/notifications${queryString}`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch notifications');
            }
            
            const data = await response.json();
            return data.data.notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }
    
    /**
     * Mark a notification as read
     * @param {string} notificationId - Notification ID
     * @returns {Promise} - Promise resolving to updated notification
     */
    async markAsRead(notificationId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to mark notification as read');
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(`Error marking notification ${notificationId} as read:`, error);
            throw error;
        }
    }
    
    /**
     * Mark all notifications as read
     * @returns {Promise} - Promise resolving to success message
     */
    async markAllAsRead() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to mark all notifications as read');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
    
    /**
     * Get notification preferences
     * @returns {Promise} - Promise resolving to notification preferences
     */
    async getPreferences() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/notifications/settings`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch notification preferences');
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            throw error;
        }
    }
    
    /**
     * Update notification preferences
     * @param {Object} preferences - Updated notification preferences
     * @returns {Promise} - Promise resolving to updated preferences
     */
    async updatePreferences(preferences) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/notifications/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify({ settings: preferences })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update notification preferences');
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }
    
    /**
     * Get count of unread notifications
     * @returns {Promise} - Promise resolving to count of unread notifications
     */
    async getUnreadCount() {
        try {
            const notifications = await this.getNotifications({ read: false });
            return notifications.length;
        } catch (error) {
            console.error('Error getting unread notification count:', error);
            return 0;
        }
    }
}

// Create and export notifications service instance
const notificationsService = new NotificationsService();