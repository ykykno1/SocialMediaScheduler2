/**
 * API service for Shabbat Robot
 * Handles API interactions with social media platforms
 */

const ApiService = {
    /**
     * Make an authenticated API request
     * @param {string} platform - Platform name
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise} Promise resolving with API response
     */
    request: async function(platform, endpoint, options = {}) {
        // Get access token
        const accessToken = AuthService.getAccessToken(platform);
        
        if (!accessToken) {
            throw new Error(`Not authenticated with ${platform}`);
        }
        
        // Get base URL
        const baseUrl = CONFIG.API[platform].base;
        
        if (!baseUrl) {
            throw new Error(`Invalid platform: ${platform}`);
        }
        
        // Set up request options
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                ...options.headers
            }
        };
        
        // Add body if provided
        if (options.body) {
            if (options.headers && options.headers['Content-Type'] === 'application/json') {
                requestOptions.body = JSON.stringify(options.body);
            } else {
                requestOptions.body = options.body;
            }
        }
        
        // Build URL
        const url = `${baseUrl}${endpoint}${options.params ? `?${new URLSearchParams(options.params)}` : ''}`;
        
        try {
            Logger.debug('Making API request', { platform, endpoint, options });
            
            const response = await fetch(url, requestOptions);
            
            // Handle response
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API error ${response.status}: ${errorData.message || response.statusText}`);
            }
            
            // Parse response as JSON
            const data = await response.json();
            
            Logger.debug('API request successful', { platform, endpoint, response: data });
            
            return data;
        } catch (error) {
            Logger.error('API request failed', { platform, endpoint, error: error.message });
            throw error;
        }
    },
    
    /**
     * Get user profile information
     * @param {string} platform - Platform name
     * @returns {Promise} Promise resolving with user profile
     */
    getUserProfile: function(platform) {
        let endpoint;
        
        switch (platform) {
            case 'facebook':
                endpoint = '/me?fields=id,name,picture';
                break;
                
            case 'instagram':
                endpoint = '/me?fields=id,username,account_type';
                break;
                
            case 'youtube':
                endpoint = '/channels?part=snippet&mine=true';
                break;
                
            case 'tiktok':
                endpoint = '/user/info/';
                break;
                
            default:
                return Promise.reject(new Error(`Unsupported platform: ${platform}`));
        }
        
        return this.request(platform, endpoint);
    },
    
    /**
     * Get content items (posts, videos) from a platform
     * @param {string} platform - Platform name
     * @param {Object} options - Request options
     * @returns {Promise} Promise resolving with content items
     */
    getContentItems: function(platform, options = {}) {
        let endpoint, params;
        
        switch (platform) {
            case 'facebook':
                endpoint = CONFIG.API.facebook.posts;
                params = {
                    fields: 'id,message,created_time,permalink_url,full_picture',
                    limit: options.limit || 50
                };
                break;
                
            case 'instagram':
                endpoint = CONFIG.API.instagram.media;
                params = {
                    fields: 'id,caption,media_type,media_url,permalink,timestamp',
                    limit: options.limit || 50
                };
                break;
                
            case 'youtube':
                endpoint = CONFIG.API.youtube.videos;
                params = {
                    part: 'snippet,status',
                    mine: true,
                    maxResults: options.limit || 50
                };
                break;
                
            case 'tiktok':
                endpoint = CONFIG.API.tiktok.videos;
                params = {
                    fields: 'id,video_description,create_time,share_url,cover_image_url',
                    count: options.limit || 50
                };
                break;
                
            default:
                return Promise.reject(new Error(`Unsupported platform: ${platform}`));
        }
        
        return this.request(platform, endpoint, { params });
    },
    
    /**
     * Update content visibility (hide or show)
     * @param {string} platform - Platform name
     * @param {string} contentId - Content ID
     * @param {string} action - Action ('hide' or 'restore')
     * @returns {Promise} Promise resolving when update is complete
     */
    updateContentVisibility: function(platform, contentId, action) {
        let endpoint, method, body;
        const isHide = action === CONFIG.ACTIONS.HIDE;
        
        switch (platform) {
            case 'facebook':
                endpoint = CONFIG.API.facebook.updatePost.replace('{post-id}', contentId);
                method = 'POST';
                body = {
                    privacy: { value: isHide ? CONFIG.PRIVACY_SETTINGS.facebook.hide : CONFIG.PRIVACY_SETTINGS.facebook.restore }
                };
                break;
                
            case 'instagram':
                // Instagram uses different endpoints for archive/unarchive
                if (isHide) {
                    endpoint = `/${contentId}/media_publish?media_type=ARCHIVED_MEDIA`;
                } else {
                    endpoint = `/${contentId}/media_publish?media_type=PUBLISHED_MEDIA`;
                }
                method = 'POST';
                break;
                
            case 'youtube':
                endpoint = CONFIG.API.youtube.updateVideo.replace('{video-id}', contentId);
                method = 'PUT';
                body = {
                    id: contentId,
                    status: {
                        privacyStatus: isHide ? CONFIG.PRIVACY_SETTINGS.youtube.hide : CONFIG.PRIVACY_SETTINGS.youtube.restore
                    }
                };
                break;
                
            case 'tiktok':
                endpoint = CONFIG.API.tiktok.updateVideo;
                method = 'POST';
                body = {
                    video_id: contentId,
                    privacy_level: isHide ? CONFIG.PRIVACY_SETTINGS.tiktok.hide : CONFIG.PRIVACY_SETTINGS.tiktok.restore
                };
                break;
                
            default:
                return Promise.reject(new Error(`Unsupported platform: ${platform}`));
        }
        
        return this.request(platform, endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body
        });
    },
    
    /**
     * Test connection to platform
     * @param {string} platform - Platform name
     * @returns {Promise} Promise resolving with connection status
     */
    testConnection: function(platform) {
        return this.getUserProfile(platform)
            .then(profile => {
                return {
                    connected: true,
                    profile
                };
            })
            .catch(error => {
                return {
                    connected: false,
                    error: error.message
                };
            });
    },
    
    /**
     * Get the default "Shabbat mode" post content
     * @param {string} platform - Platform name
     * @returns {Object} Default post content
     */
    getDefaultShabbatPost: function(platform) {
        const baseMessage = 'העמוד שומר שבת. נשוב לפעילות במוצאי שבת.';
        
        switch (platform) {
            case 'facebook':
                return {
                    message: baseMessage,
                    privacy: { value: 'EVERYONE' }
                };
                
            case 'instagram':
                return {
                    caption: baseMessage,
                    // Would need image URL for Instagram
                };
                
            case 'youtube':
                return {
                    snippet: {
                        title: 'שומרים שבת',
                        description: baseMessage
                    },
                    status: {
                        privacyStatus: 'public'
                    }
                };
                
            case 'tiktok':
                return {
                    description: baseMessage,
                    privacy_level: 'public'
                };
                
            default:
                return { message: baseMessage };
        }
    }
};

// Expose the ApiService object globally
window.ApiService = ApiService;