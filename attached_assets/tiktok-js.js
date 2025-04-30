/**
 * TikTok-specific implementation for Shabbat Robot
 */

const TikTokPlatform = {
    /**
     * Platform name
     */
    name: 'tiktok',
    
    /**
     * Platform display name
     */
    displayName: 'טיקטוק',
    
    /**
     * Check if platform is configured
     * @returns {boolean} True if configured
     */
    isConfigured: function() {
        const settings = StorageService.getSettings();
        const config = settings.platforms[this.name];
        return config && config.enabled && config.apiKey && config.apiSecret;
    },
    
    /**
     * Check if authenticated with platform
     * @returns {boolean} True if authenticated
     */
    isAuthenticated: function() {
        return AuthService.isAuthenticated(this.name);
    },
    
    /**
     * Initialize the platform
     */
    initialize: function() {
        Logger.info(`Initializing ${this.displayName} platform`);
        
        if (!this.isConfigured()) {
            Logger.info(`${this.displayName} is not configured`);
            return;
        }
        
        // Try to authenticate if not already
        if (!this.isAuthenticated()) {
            Logger.info(`${this.displayName} is not authenticated`);
        }
    },
    
    /**
     * Get user's videos
     * @param {Object} options - Request options
     * @returns {Promise} Promise resolving with videos
     */
    getVideos: async function(options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error(`Not authenticated with ${this.displayName}`);
        }
        
        try {
            const response = await ApiService.getContentItems(this.name, options);
            
            return {
                videos: response.data.videos.map(video => ({
                    id: video.id,
                    description: video.video_description || '',
                    createdTime: video.create_time,
                    shareUrl: video.share_url,
                    coverImageUrl: video.cover_image_url,
                    visibility: video.visibility_type || 'public'
                })),
                cursor: response.cursor,
                hasMore: response.has_more
            };
        } catch (error) {
            Logger.error(`Failed to get ${this.displayName} videos`, { error: error.message });
            throw error;
        }
    },
    
    /**
     * Update video visibility
     * @param {string} videoId - Video ID
     * @param {boolean} hide - Whether to make the video private
     * @returns {Promise} Promise resolving when update is complete
     */
    updateVideoVisibility: function(videoId, hide) {
        if (!this.isAuthenticated()) {
            return Promise.reject(new Error(`Not authenticated with ${this.displayName}`));
        }
        
        const action = hide ? CONFIG.ACTIONS.HIDE : CONFIG.ACTIONS.RESTORE;
        
        return ApiService.updateContentVisibility(this.name, videoId, action);
    },
    
    /**
     * Make a video private
     * @param {string} videoId - Video ID
     * @returns {Promise} Promise resolving when video is made private
     */
    hideVideo: function(videoId) {
        return this.updateVideoVisibility(videoId, true);
    },
    
    /**
     * Make a video public
     * @param {string} videoId - Video ID
     * @returns {Promise} Promise resolving when video is made public
     */
    restoreVideo: function(videoId) {
        return this.updateVideoVisibility(videoId, false);
    },
    
    /**
     * Make all videos private
     * @param {Array} exceptedVideoIds - Array of video IDs to exclude
     * @returns {Promise} Promise resolving with operation result
     */
    hideAllVideos: async function(exceptedVideoIds = []) {
        if (!this.isAuthenticated()) {
            return Promise.reject(new Error(`Not authenticated with ${this.displayName}`));
        }
        
        try {
            const { videos } = await this.getVideos();
            
            const results = {
                total: videos.length,
                processed: 0,
                skipped: 0,
                failed: 0,
                errors: []
            };
            
            for (const video of videos) {
                // Skip excepted videos
                if (exceptedVideoIds.includes(video.id)) {
                    results.skipped++;
                    continue;
                }
                
                // Skip already private videos
                if (video.visibility === 'private') {
                    results.skipped++;
                    continue;
                }
                
                try {
                    await this.hideVideo(video.id);
                    results.processed++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        videoId: video.id,
                        error: error.message
                    });
                }
            }
            
            return results;
        } catch (error) {
            Logger.error(`Failed to hide all ${this.displayName} videos`, { error: error.message });
            throw error;
        }
    },
    
    /**
     * Make all videos public
     * @returns {Promise} Promise resolving with operation result
     */
    restoreAllVideos: async function() {
        if (!this.isAuthenticated()) {
            return Promise.reject(new Error(`Not authenticated with ${this.displayName}`));
        }
        
        try {
            const { videos } = await this.getVideos();
            
            const results = {
                total: videos.length,
                processed: 0,
                skipped: 0,
                failed: 0,
                errors: []
            };
            
            for (const video of videos) {
                // Skip already public videos
                if (video.visibility === 'public') {
                    results.skipped++;
                    continue;
                }
                
                try {
                    await this.restoreVideo(video.id);
                    results.processed++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        videoId: video.id,
                        error: error.message
                    });
                }
            }
            
            return results;
        } catch (error) {
            Logger.error(`Failed to restore all ${this.displayName} videos`, { error: error.message });
            throw error;
        }
    },
    
    /**
     * Test connection to TikTok
     * @returns {Promise} Promise resolving with connection status
     */
    testConnection: function() {
        return ApiService.testConnection(this.name);
    }
};

// Register the platform
window.TikTokPlatform = TikTokPlatform;