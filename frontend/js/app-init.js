/**
 * Application Initialization
 * Handles application startup and global utilities
 */

// Global loading spinner functions
function showLoading() {
    document.getElementById('loading-spinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-spinner').classList.add('hidden');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();
    
    // Dispatch app-ready event for module initialization
    document.dispatchEvent(new Event('app-ready'));
    
    // Update API URL from config
    if (CONFIG.API_URL) {
        console.log(`API URL: ${CONFIG.API_URL}`);
    }
    
    // Check if mock API is enabled
    if (typeof MOCK_API_ENABLED !== 'undefined' && MOCK_API_ENABLED) {
        console.log('Mock API is enabled');
    }
});