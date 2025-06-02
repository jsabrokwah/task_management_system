/**
 * Profile Service
 * Handles user profile operations
 */
class ProfileService {
    /**
     * Get user profile data
     * @returns {Promise} - Promise resolving to user profile data
     */
    async getProfile() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    }
    
    /**
     * Update user profile
     * @param {Object} profileData - Updated profile data
     * @returns {Promise} - Promise resolving to updated profile
     */
    async updateProfile(profileData) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }
            
            const data = await response.json();
            
            // Update stored user data
            const user = authService.getUser();
            if (user) {
                Object.assign(user, data.user);
                localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(user));
            }
            
            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }
    
    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} - Promise resolving when password is changed
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to change password');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
    
    /**
     * Get notification preferences
     * @returns {Promise} - Promise resolving to notification preferences
     */
    async getNotificationPreferences() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/notifications/settings`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch notification preferences');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            throw error;
        }
    }
    
    /**
     * Update notification preferences
     * @param {Object} preferences - Updated notification preferences
     * @returns {Promise} - Promise resolving when preferences are updated
     */
    async updateNotificationPreferences(preferences) {
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
     * Display user profile in the UI
     * @param {Object} user - User object
     */
    displayProfile(user) {
        document.getElementById('profile-username').textContent = user.Username || 'N/A';
        document.getElementById('profile-email').textContent = user.Email || 'N/A';
        document.getElementById('profile-role').textContent = `Role: ${user.Role === CONFIG.USER_ROLES.ADMIN ? 'Administrator' : 'Team Member'}`;
        
        // Update form fields
        document.getElementById('update-email').value = user.Email || '';
    }
}

// Create and export profile service instance
const profileService = new ProfileService();