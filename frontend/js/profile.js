/**
 * Profile Service
 * Handles user profile operations
 */
class ProfileService {
    /**
     * Get user profile
     * @returns {Promise} - Promise resolving to user profile
     */
    async getProfile() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch profile');
            }
            
            const data = await response.json();
            return data.data;
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
            const response = await fetch(`${CONFIG.API_URL}/auth/profile`, {
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
            return data.data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }
    
    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} - Promise resolving to success message
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/change-password`, {
                method: 'POST',
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
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
}

// Create and export profile service instance
const profileService = new ProfileService();