/**
 * Authentication Service
 * Handles user authentication, token management, and user session
 */
class AuthService {
    constructor() {
        this.token = null;
        this.user = null;
        this.refreshTimer = null;
        this.initialized = false;
        this.initRetryCount = 0;
        this.maxRetries = 5;
    }
    
    /**
     * Initialize the auth service - call this after CONFIG is loaded
     */
    init() {
        if (this.initialized) return;
        
        try {
            // Check if CONFIG is defined
            if (typeof CONFIG === 'undefined' || !CONFIG.AUTH) {
                if (this.initRetryCount < this.maxRetries) {
                    console.warn('CONFIG not ready, retrying initialization in 100ms');
                    this.initRetryCount++;
                    setTimeout(() => this.init(), 100);
                    return;
                } else {
                    console.error('CONFIG is not defined after multiple retries. Cannot initialize AuthService.');
                    return;
                }
            }
            
            try {
                // Safely get token from localStorage
                const tokenValue = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
                this.token = tokenValue && tokenValue !== 'null' && tokenValue !== 'undefined' ? tokenValue : null;
                
                // Safely parse user data
                const userJson = localStorage.getItem(CONFIG.AUTH.USER_KEY);
                if (userJson && userJson !== 'null' && userJson !== 'undefined') {
                    try {
                        this.user = JSON.parse(userJson);
                    } catch (e) {
                        console.warn('Invalid user data in localStorage, clearing it');
                        localStorage.removeItem(CONFIG.AUTH.USER_KEY);
                        this.user = null;
                    }
                } else {
                    this.user = null;
                }
            } catch (storageError) {
                console.warn('Error accessing localStorage:', storageError);
                this.token = null;
                this.user = null;
            }
            
            // Set up token refresh if user is logged in
            if (this.isAuthenticated()) {
                this.setupTokenRefresh();
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing AuthService:', error);
        }
    }
    
    /**
     * Authenticate user with username and password
     * @param {string} username - User's username
     * @param {string} password - User's password
     * @returns {Promise} - Promise resolving to user object
     */
    async login(username, password) {
        try {
            if (typeof showLoading === 'function') showLoading();
            
            if (typeof CONFIG === 'undefined' || !CONFIG || !CONFIG.API_URL) {
                throw new Error('Configuration not available');
            }
            
            const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
            
            const data = await response.json();
            
            if (!data.token || !data.user) {
                throw new Error('Invalid response from server');
            }
            
            this.setSession(data.token, data.user);
            
            if (typeof hideLoading === 'function') hideLoading();
            return data.user;
        } catch (error) {
            if (typeof hideLoading === 'function') hideLoading();
            throw error;
        }
    }
    
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise} - Promise resolving to user object
     */
    async register(userData) {
        try {
            if (typeof showLoading === 'function') showLoading();
            
            if (typeof CONFIG === 'undefined' || !CONFIG || !CONFIG.API_URL) {
                throw new Error('Configuration not available');
            }
            
            const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }
            
            const data = await response.json();
            
            if (!data.user) {
                throw new Error('Invalid response from server');
            }
            
            if (typeof hideLoading === 'function') hideLoading();
            return data.user;
        } catch (error) {
            if (typeof hideLoading === 'function') hideLoading();
            throw error;
        }
    }
    
    /**
     * Log out the current user
     */
    logout() {
        try {
            if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.AUTH) {
                localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
                localStorage.removeItem(CONFIG.AUTH.USER_KEY);
            } else {
                // Fallback if CONFIG is not available
                localStorage.removeItem('tms_token');
                localStorage.removeItem('tms_user');
            }
        } catch (e) {
            console.warn('Error clearing localStorage during logout:', e);
        }
        
        this.token = null;
        this.user = null;
        
        // Clear any refresh timers
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
    
    /**
     * Get the current authentication token
     * @returns {string|null} - JWT token or null if not authenticated
     */
    getToken() {
        return this.token;
    }
    
    /**
     * Get the current user object
     * @returns {Object|null} - User object or null if not authenticated
     */
    getUser() {
        return this.user;
    }
    
    /**
     * Check if user is authenticated
     * @returns {boolean} - True if authenticated, false otherwise
     */
    isAuthenticated() {
        return !!(this.token && this.user && this.isTokenValid());
    }
    
    /**
     * Check if the current token is valid
     * @returns {boolean} - True if token is valid, false otherwise
     */
    isTokenValid() {
        if (!this.token) return false;
        
        try {
            // Simple validation - check if token has three parts separated by dots
            const parts = this.token.split('.');
            return parts.length === 3;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check if current user is an admin
     * @returns {boolean} - True if user is admin, false otherwise
     */
    isAdmin() {
        if (!this.user || !this.user.role) return false;
        
        try {
            if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.USER_ROLES) {
                return this.user.role === CONFIG.USER_ROLES.ADMIN;
            } else {
                // Fallback if CONFIG is not available
                return this.user.role === 'admin';
            }
        } catch (e) {
            console.warn('Error checking admin status:', e);
            return false;
        }
    }
    
    /**
     * Update user profile
     * @param {Object} profileData - Updated profile data
     * @returns {Promise} - Promise resolving to updated user object
     */
    async updateProfile(profileData) {
        try {
            if (typeof showLoading === 'function') showLoading();
            
            if (typeof CONFIG === 'undefined' || !CONFIG || !CONFIG.API_URL) {
                throw new Error('Configuration not available');
            }
            
            if (!this.isAuthenticated()) {
                throw new Error('User not authenticated');
            }
            
            const response = await fetch(`${CONFIG.API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }
            
            const data = await response.json();
            
            // Update stored user data
            this.user = data.user;
            try {
                if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.AUTH) {
                    localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(data.user));
                } else {
                    localStorage.setItem('tms_user', JSON.stringify(data.user));
                }
            } catch (storageError) {
                console.warn('Failed to store user data in localStorage:', storageError);
            }
            
            if (typeof hideLoading === 'function') hideLoading();
            return data.user;
        } catch (error) {
            if (typeof hideLoading === 'function') hideLoading();
            throw error;
        }
    }
    
    /**
     * Set user session data
     * @param {string} token - JWT token
     * @param {Object} user - User object
     */
    setSession(token, user) {
        this.token = token;
        this.user = user;
        
        try {
            if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.AUTH) {
                localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, token);
                localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(user));
            } else {
                // Fallback if CONFIG is not available
                localStorage.setItem('tms_token', token);
                localStorage.setItem('tms_user', JSON.stringify(user));
            }
        } catch (storageError) {
            console.warn('Failed to store session data in localStorage:', storageError);
        }
        
        this.setupTokenRefresh();
    }
    
    /**
     * Set up automatic token refresh
     */
    setupTokenRefresh() {
        // Clear any existing refresh timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Only set up refresh if CONFIG is available
        if (typeof CONFIG === 'undefined' || !CONFIG || !CONFIG.AUTH || !CONFIG.AUTH.REFRESH_INTERVAL) {
            console.warn('CONFIG not properly defined for token refresh');
            return;
        }
        
        // Set up new refresh timer
        this.refreshTimer = setInterval(async () => {
            if (!this.isAuthenticated()) {
                console.warn('Not authenticated, cancelling token refresh');
                this.logout();
                return;
            }
            
            let retries = 0;
            const maxRetries = 3;
            
            const attemptRefresh = async () => {
                try {
                    const response = await fetch(`${CONFIG.API_URL}/auth/refresh`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        this.token = data.token;
                        try {
                            localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, data.token);
                        } catch (storageError) {
                            console.warn('Failed to store token in localStorage:', storageError);
                        }
                    } else {
                        // If refresh fails with an error response, log out the user
                        console.warn('Token refresh failed with status:', response.status);
                        this.logout();
                    }
                } catch (error) {
                    console.error('Token refresh network error:', error);
                    retries++;
                    if (retries < maxRetries) {
                        console.log(`Retrying token refresh (${retries}/${maxRetries})...`);
                        setTimeout(attemptRefresh, 5000); // Retry after 5 seconds
                    } else {
                        console.error('Max token refresh retries reached, logging out');
                        this.logout();
                    }
                }
            };
            
            attemptRefresh();
        }, CONFIG.AUTH.REFRESH_INTERVAL);
    }
}

// Create auth service instance but don't initialize yet
window.authService = new AuthService();

// Custom event for when CONFIG is ready
window.configReady = false;
window.addEventListener('config-ready', () => {
    if (window.authService && !window.authService.initialized) {
        window.authService.init();
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if CONFIG is already available
    if (typeof CONFIG !== 'undefined' && CONFIG) {
        window.configReady = true;
        window.dispatchEvent(new Event('config-ready'));
    } else {
        // Set up a MutationObserver to watch for CONFIG
        const checkConfigInterval = setInterval(() => {
            if (typeof CONFIG !== 'undefined' && CONFIG) {
                clearInterval(checkConfigInterval);
                window.configReady = true;
                window.dispatchEvent(new Event('config-ready'));
            }
        }, 50);
        
        // Fallback timeout - initialize anyway after 2 seconds
        setTimeout(() => {
            clearInterval(checkConfigInterval);
            if (!window.configReady && window.authService) {
                console.warn('CONFIG not detected after timeout, initializing AuthService anyway');
                window.authService.init();
            }
        }, 2000);
    }
});