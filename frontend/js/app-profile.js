/**
 * Profile UI
 * Handles profile-specific UI functionality
 */

// DOM Elements
const profileElements = {
    // Profile info
    profileUsername: document.getElementById('profile-username'),
    profileEmail: document.getElementById('profile-email'),
    profileRole: document.getElementById('profile-role'),
    
    // Update profile form
    updateProfileForm: document.getElementById('update-profile-form'),
    updateEmail: document.getElementById('update-email'),
    currentPassword: document.getElementById('current-password'),
    newPassword: document.getElementById('new-password'),
    confirmNewPassword: document.getElementById('confirm-new-password'),
    
    // Notification preferences form
    notificationPreferencesForm: document.getElementById('notification-preferences-form'),
    emailNotifications: document.getElementById('email-notifications'),
    taskAssignments: document.getElementById('task-assignments'),
    deadlineReminders: document.getElementById('deadline-reminders'),
    statusUpdates: document.getElementById('status-updates')
};

/**
 * Initialize profile
 */
function initProfile() {
    // Set up event listeners
    setupProfileEventListeners();
}

/**
 * Set up profile-related event listeners
 */
function setupProfileEventListeners() {
    // Update profile form
    profileElements.updateProfileForm.addEventListener('submit', handleUpdateProfileSubmit);
    
    // Notification preferences form
    profileElements.notificationPreferencesForm.addEventListener('submit', handleUpdatePreferencesSubmit);
}

/**
 * Refresh profile data and display
 */
async function refreshProfile() {
    try {
        showLoading();
        
        // Get user profile
        const profile = await profileService.getProfile();
        
        // Display profile info
        displayProfileInfo(profile);
        
        // Get notification preferences
        const preferences = await notificationsService.getPreferences();
        
        // Display notification preferences
        displayNotificationPreferences(preferences);
        
        hideLoading();
    } catch (error) {
        console.error('Error refreshing profile:', error);
        hideLoading();
    }
}

/**
 * Display profile information
 * @param {Object} profile - User profile data
 */
function displayProfileInfo(profile) {
    // Update profile info
    profileElements.profileUsername.textContent = profile.username || profile.email;
    profileElements.profileEmail.textContent = profile.email;
    profileElements.profileRole.textContent = `Role: ${formatRole(profile.role)}`;
    
    // Update form fields
    profileElements.updateEmail.value = profile.email;
}

/**
 * Format role for display
 * @param {string} role - User role
 * @returns {string} - Formatted role
 */
function formatRole(role) {
    switch (role) {
        case CONFIG.USER_ROLES.ADMIN:
            return 'Administrator';
        case CONFIG.USER_ROLES.TEAM_MEMBER:
            return 'Team Member';
        default:
            return role;
    }
}

/**
 * Display notification preferences
 * @param {Object} preferences - Notification preferences
 */
function displayNotificationPreferences(preferences) {
    profileElements.emailNotifications.checked = preferences.emailNotifications;
    profileElements.taskAssignments.checked = preferences.taskAssignments;
    profileElements.deadlineReminders.checked = preferences.deadlineReminders;
    profileElements.statusUpdates.checked = preferences.statusUpdates;
}

/**
 * Handle update profile form submission
 * @param {Event} e - Form submit event
 */
async function handleUpdateProfileSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const email = profileElements.updateEmail.value;
    const currentPassword = profileElements.currentPassword.value;
    const newPassword = profileElements.newPassword.value;
    const confirmNewPassword = profileElements.confirmNewPassword.value;
    
    // Validate passwords if changing password
    if (newPassword || confirmNewPassword) {
        if (!currentPassword) {
            alert('Please enter your current password');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match');
            return;
        }
    }
    
    try {
        showLoading();
        
        // Update profile
        const profileData = { email };
        await profileService.updateProfile(profileData);
        
        // Change password if provided
        if (newPassword) {
            await profileService.changePassword(currentPassword, newPassword);
        }
        
        // Clear password fields
        profileElements.currentPassword.value = '';
        profileElements.newPassword.value = '';
        profileElements.confirmNewPassword.value = '';
        
        // Refresh profile
        await refreshProfile();
        
        hideLoading();
        
        alert('Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        hideLoading();
        alert('Error updating profile: ' + (error.message || 'Please try again'));
    }
}

/**
 * Handle update notification preferences form submission
 * @param {Event} e - Form submit event
 */
async function handleUpdatePreferencesSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const preferences = {
        emailNotifications: profileElements.emailNotifications.checked,
        taskAssignments: profileElements.taskAssignments.checked,
        deadlineReminders: profileElements.deadlineReminders.checked,
        statusUpdates: profileElements.statusUpdates.checked
    };
    
    try {
        showLoading();
        
        // Update preferences
        await notificationsService.updatePreferences(preferences);
        
        hideLoading();
        
        alert('Notification preferences updated successfully');
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        hideLoading();
        alert('Error updating notification preferences: ' + (error.message || 'Please try again'));
    }
}

// Initialize profile when app is ready
document.addEventListener('app-ready', initProfile);