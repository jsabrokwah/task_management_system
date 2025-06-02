/**
 * Admin Service
 * Handles admin-specific operations
 */
class AdminService {
    /**
     * Get all users
     * @returns {Promise} - Promise resolving to array of users
     */
    async getUsers() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch users');
            }
            
            const data = await response.json();
            return data.data.users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }
    
    /**
     * Get task statistics
     * @returns {Promise} - Promise resolving to task statistics
     */
    async getTaskStatistics() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/admin/tasks/overview`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch task statistics');
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching task statistics:', error);
            throw error;
        }
    }
    
    /**
     * Get upcoming deadlines
     * @param {number} days - Number of days to look ahead
     * @returns {Promise} - Promise resolving to tasks with upcoming deadlines
     */
    async getUpcomingDeadlines(days = 7) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/admin/tasks/deadlines?days=${days}`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch upcoming deadlines');
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching upcoming deadlines:', error);
            throw error;
        }
    }
    
    /**
     * Get team performance metrics
     * @returns {Promise} - Promise resolving to team performance metrics
     */
    async getTeamPerformance() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/admin/performance`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch team performance');
            }
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching team performance:', error);
            throw error;
        }
    }
}

// Create and export admin service instance
const adminService = new AdminService();