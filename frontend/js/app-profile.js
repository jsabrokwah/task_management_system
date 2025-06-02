/**
 * Profile UI Functions
 * Extension of app.js for profile-related UI functionality
 */

// Load profile data
async function loadProfile() {
    try {
        showLoading();
        
        // Get user profile
        const user = authService.getUser();
        
        // Display profile information
        profileService.displayProfile(user);
        
        // Get notification preferences
        const preferences = await profileService.getNotificationPreferences();
        
        // Update notification preferences form
        document.getElementById('email-notifications').checked = preferences.emailNotifications;
        document.getElementById('task-assignments').checked = preferences.taskAssignments;
        document.getElementById('deadline-reminders').checked = preferences.deadlineReminders;
        document.getElementById('status-updates').checked = preferences.statusUpdates;
        
        hideLoading();
    } catch (error) {
        console.error('Error loading profile:', error);
        hideLoading();
        showError('Failed to load profile data');
    }
}

// Handle profile update form submission
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const email = document.getElementById('update-email').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
    
    // Validate form
    if (newPassword && newPassword !== confirmNewPassword) {
        showError('New passwords do not match');
        return;
    }
    
    try {
        showLoading();
        
        // Update profile
        const profileData = { email };
        await profileService.updateProfile(profileData);
        
        // Change password if provided
        if (currentPassword && newPassword) {
            await profileService.changePassword(currentPassword, newPassword);
        }
        
        // Clear password fields
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';
        
        hideLoading();
        showMessage('Profile updated successfully');
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to update profile');
    }
}

// Handle notification preferences form submission
async function handleNotificationPreferencesUpdate(e) {
    e.preventDefault();
    
    const preferences = {
        emailNotifications: document.getElementById('email-notifications').checked,
        taskAssignments: document.getElementById('task-assignments').checked,
        deadlineReminders: document.getElementById('deadline-reminders').checked,
        statusUpdates: document.getElementById('status-updates').checked
    };
    
    try {
        showLoading();
        
        await profileService.updateNotificationPreferences(preferences);
        
        hideLoading();
        showMessage('Notification preferences updated successfully');
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to update notification preferences');
    }
}

// Initialize profile-related event listeners
function initProfileEvents() {
    // Profile update form
    const updateProfileForm = document.getElementById('update-profile-form');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Notification preferences form
    const notificationPreferencesForm = document.getElementById('notification-preferences-form');
    if (notificationPreferencesForm) {
        notificationPreferencesForm.addEventListener('submit', handleNotificationPreferencesUpdate);
    }
}