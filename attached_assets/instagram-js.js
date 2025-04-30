/**
 * Instagram-specific implementation for Shabbat Robot
 */

const InstagramPlatform = {
    /**
     * Platform name
     */
    name: 'instagram',
    
    /**
     * Platform display name
     */
    displayName: 'אינסטגרם',
    
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
     * Get user's posts
     * @param {Object} options - Request options
     * @returns {Promise} Promise resolving with posts
     */
    getPosts: async function(options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error(`Not authenticated with ${this.displayName}`);
        }
        
        try {
            const response = await ApiService.getContentItems(this.name, options);
            
            return {
                posts: response.data.map(post => ({
                    id: post.id,
                    caption: post.caption || '',
                    mediaType: post.media_type,
                    mediaUrl: post.media_url,
                    permalink: post.permalink,
                    timestamp: post.timestamp
                })),
                paging: response.paging
            };
        } catch (error) {
            Logger.error(`Failed to get ${this.displayName} posts`, { error: error.message });
            throw error;
        }
    },
    
    /**
     * Update post visibility (archive/unarchive)
     * @param {string} postId - Post ID
     * @param {boolean} hide - Whether to archive the post
     * @returns {Promise} Promise resolving when update is complete
     */
    updatePostVisibility: function(postId, hide) {
        if (!this.isAuthenticated()) {
            return Promise.reject(new Error(`Not authenticated with ${this.displayName}`));
        }
        
        const action = hide ? CONFIG.ACTIONS.HIDE : CONFIG.ACTIONS.RESTORE;
        
        return ApiService.updateContentVisibility(this.name, postId, action);
    },
    
    /**
     * Archive a post
     * @param {string} postId - Post ID
     * @returns {Promise} Promise resolving when post is archived
     */
    archivePost: function(postId) {
        return this.updatePostVisibility(postId, true);
    },
    
    /**
     * Unarchive a post
     * @param {string} postId - Post ID
     * @returns {Promise} Promise resolving when post is unarchived
     */
    unarchivePost: function(postId) {
        return this.updatePostVisibility(postId, false);
    },
    
    /**
     * Archive all posts
     * @param {Array} exceptedPostIds - Array of post IDs to exclude
     * @returns {Promise} Promise resolving with operation result
     */
    archiveAllPosts: async function(exceptedPostIds = []) {
        if (!this.isAuthenticated()) {
            return Promise.reject(new Error(`Not authenticated with ${this.displayName}`));
        }
        
        try {
            const { posts } = await this.getPosts();
            
            const results = {
                total: posts.length,
                processed: 0,
                skipped: 0,
                failed: 0,
                errors: []
            };
            
            for (const post of posts) {
                // Skip excepted posts
                if (exceptedPostIds.includes(post.id)) {
                    results.skipped++;
                    continue;
                }
                
                try {
                    await this.archivePost(post.id);
                    results.processed++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        postId: post.id,
                        error: error.message
                    });
                }
            }
            
            return results;
        } catch (error) {
            Logger.error(`Failed to archive all ${this.displayName} posts`, { error: error.message });
            throw error;
        }
    },
    
    /**
     * Unarchive all posts
     * @returns {Promise} Promise resolving with operation result
     */
    unarchiveAllPosts: async function() {
        if (!this.isAuthenticated()) {
            return Promise.reject(new Error(`Not authenticated with ${this.displayName}`));
        }
        
        try {
            const { posts } = await this.getPosts();
            
            const results = {
                total: posts.length,
                processed: 0,
                failed: 0,
                errors: []
            };
            
            for (const post of posts) {
                try {
                    await this.unarchivePost(post.id);
                    results.processed++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        postId: post.id,
                        error: error.message
                    });
                }
            }
            
            return results;
        } catch (error) {
            Logger.error(`Failed to unarchive all ${this.displayName} posts`, { error: error.message });
            throw error;
        }
    },
    
    /**
     * Test connection to Instagram
     * @returns {Promise} Promise resolving with connection status
     */
    testConnection: function() {
        return ApiService.testConnection(this.name);
    }
};

// Register the platform
window.InstagramPlatform = InstagramPlatform;