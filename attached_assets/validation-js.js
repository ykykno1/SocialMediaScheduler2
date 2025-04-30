/**
 * Validation utility functions for Shabbat Robot
 */

const ValidationUtils = {
    /**
     * Check if a string is empty or only whitespace
     * @param {string} str - String to check
     * @returns {boolean} True if string is empty
     */
    isEmpty: function(str) {
        return !str || str.trim() === '';
    },
    
    /**
     * Check if a value is a valid time string in format HH:MM
     * @param {string} timeStr - Time string to validate
     * @returns {boolean} True if valid time string
     */
    isValidTimeFormat: function(timeStr) {
        const regex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
        return regex.test(timeStr);
    },
    
    /**
     * Validate API key format
     * @param {string} apiKey - API key to validate
     * @returns {boolean} True if valid API key format
     */
    isValidApiKey: function(apiKey) {
        // This is a simple validation, adjust based on specific API requirements
        return typeof apiKey === 'string' && apiKey.length >= 8;
    },
    
    /**
     * Validate API secret format
     * @param {string} apiSecret - API secret to validate
     * @returns {boolean} True if valid API secret format
     */
    isValidApiSecret: function(apiSecret) {
        // This is a simple validation, adjust based on specific API requirements
        return typeof apiSecret === 'string' && apiSecret.length >= 8;
    },
    
    /**
     * Validate platform configuration
     * @param {Object} platformConfig - Platform configuration to validate
     * @returns {Object} Object with isValid and errors properties
     */
    validatePlatformConfig: function(platformConfig) {
        const errors = {};
        
        if (!platformConfig.enabled) {
            return { isValid: true, errors: {} };
        }
        
        if (!this.isValidApiKey(platformConfig.apiKey)) {
            errors.apiKey = 'מפתח API אינו תקין';
        }
        
        if (!this.isValidApiSecret(platformConfig.apiSecret)) {
            errors.apiSecret = 'סיסמת API אינה תקינה';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },
    
    /**
     * Validate full application settings
     * @param {Object} settings - Settings object to validate
     * @returns {Object} Object with isValid and errors properties
     */
    validateSettings: function(settings) {
        const errors = {};
        
        // Validate hide time
        if (!this.isValidTimeFormat(settings.hideTime)) {
            errors.hideTime = 'פורמט זמן לא תקין';
        }
        
        // Validate restore time
        if (!this.isValidTimeFormat(settings.restoreTime)) {
            errors.restoreTime = 'פורמט זמן לא תקין';
        }
        
        // Validate time zone
        if (this.isEmpty(settings.timeZone)) {
            errors.timeZone = 'אזור זמן חובה';
        }
        
        // Validate platforms
        const platformErrors = {};
        Object.keys(settings.platforms).forEach(platform => {
            const validation = this.validatePlatformConfig(settings.platforms[platform]);
            if (!validation.isValid) {
                platformErrors[platform] = validation.errors;
            }
        });
        
        if (Object.keys(platformErrors).length > 0) {
            errors.platforms = platformErrors;
        }
        
        // Validate excepted posts
        if (Array.isArray(settings.exceptedPosts) && 
            settings.exceptedPosts.length > CONFIG.MAX_EXCEPTED_POSTS) {
            errors.exceptedPosts = `מקסימום ${CONFIG.MAX_EXCEPTED_POSTS} פוסטים מוחרגים`;
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },
    
    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid URL
     */
    isValidUrl: function(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Expose the ValidationUtils object globally
window.ValidationUtils = ValidationUtils;