/**
 * Scheduler service for Shabbat Robot
 * Handles scheduling of content hiding and restoration
 */

const SchedulerService = {
    // Timer for scheduler checks
    _timer: null,
    
    // Flag indicating if scheduler is running
    _isRunning: false,
    
    // Last scheduled events
    _scheduledEvents: {
        hide: null,
        restore: null
    },
    
    /**
     * Initialize the scheduler service
     */
    initialize: function() {
        if (this._isRunning) {
            return;
        }
        
        Logger.info('Initializing scheduler service');
        
        // Stop any existing timer
        this.stop();
        
        // Load settings
        const settings = StorageService.getSettings();
        
        // Check if auto-schedule is enabled
        if (!settings.autoSchedule) {
            Logger.info('Auto-schedule is disabled');
            return;
        }
        
        // Calculate next shabbat times
        this._updateScheduledEvents();
        
        // Start the timer to check for events
        this._timer = setInterval(() => this._checkSchedule(), CONFIG.SCHEDULER_INTERVAL);
        this._isRunning = true;
        
        Logger.info('Scheduler service initialized', {
            nextHide: this._scheduledEvents.hide,
            nextRestore: this._scheduledEvents.restore
        });
    },
    
    /**
     * Stop the scheduler
     */
    stop: function() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
            this._isRunning = false;
            Logger.info('Scheduler stopped');
        }
    },
    
    /**
     * Check if the scheduler is running
     * @returns {boolean} True if scheduler is running
     */
    isRunning: function() {
        return this._isRunning;
    },
    
    /**
     * Get the next scheduled events
     * @returns {Object} Object with hide and restore events
     */
    getNextEvents: function() {
        if (!this._scheduledEvents.hide || !this._scheduledEvents.restore) {
            this._updateScheduledEvents();
        }
        
        return {
            hide: this._scheduledEvents.hide,
            restore: this._scheduledEvents.restore
        };
    },
    
    /**
     * Update scheduled events based on current settings
     */
    _updateScheduledEvents: function() {
        const settings = StorageService.getSettings();
        
        if (!settings.autoSchedule) {
            this._scheduledEvents = {
                hide: null,
                restore: null
            };
            return;
        }
        
        // Get Shabbat enter and exit times
        const hideTime = DateTimeUtils.getNextShabbatEnter(settings.hideTime, settings.timeZone);
        const restoreTime = DateTimeUtils.getNextShabbatExit(settings.restoreTime, settings.timeZone);
        
        // Update scheduled events
        this._scheduledEvents = {
            hide: {
                time: hideTime,
                action: CONFIG.ACTIONS.HIDE
            },
            restore: {
                time: restoreTime,
                action: CONFIG.ACTIONS.RESTORE
            }
        };
    },
    
    /**
     * Check if scheduled events need to be executed
     */
    _checkSchedule: function() {
        if (!this._isRunning) {
            return;
        }
        
        const now = new Date();
        const events = this.getNextEvents();
        
        // Check hide event
        if (events.hide && now >= events.hide.time) {
            this._executeHideEvent();
        }
        
        // Check restore event
        if (events.restore && now >= events.restore.time) {
            this._executeRestoreEvent();
        }
        
        // Check if we need to update scheduled events (after restore)
        if (events.restore && now > events.restore.time) {
            this._updateScheduledEvents();
        }
    },
    
    /**
     * Execute content hiding action for Shabbat
     */
    _executeHideEvent: async function() {
        Logger.info('Executing scheduled hide event');
        
        try {
            const result = await this.hideAllContent();
            
            // Record in history
            StorageService.addHistoryEntry({
                action: CONFIG.ACTIONS.HIDE,
                platforms: result.platforms,
                status: result.success ? CONFIG.STATUS.SUCCESS : CONFIG.STATUS.ERROR,
                details: result
            });
            
            // Update scheduled events to prevent duplicate execution
            this._scheduledEvents.hide.executed = true;
            
            Logger.info('Hide event executed successfully', result);
        } catch (error) {
            Logger.error('Failed to execute hide event', { error: error.message });
            
            // Record error in history
            StorageService.addHistoryEntry({
                action: CONFIG.ACTIONS.HIDE,
                status: CONFIG.STATUS.ERROR,
                details: { error: error.message }
            });
        }
    },
    
    /**
     * Execute content restoration action after Shabbat
     */
    _executeRestoreEvent: async function() {
        Logger.info('Executing scheduled restore event');
        
        try {
            const result = await this.restoreAllContent();
            
            // Record in history
            StorageService.addHistoryEntry({
                action: CONFIG.ACTIONS.RESTORE,
                platforms: result.platforms,
                status: result.success ? CONFIG.STATUS.SUCCESS : CONFIG.STATUS.ERROR,
                details: result
            });
            
            // Update scheduled events to prevent duplicate execution
            this._scheduledEvents.restore.executed = true;
            
            Logger.info('Restore event executed successfully', result);
        } catch (error) {
            Logger.error('Failed to execute restore event', { error: error.message });
            
            // Record error in history
            StorageService.addHistoryEntry({
                action: CONFIG.ACTIONS.RESTORE,
                status: CONFIG.STATUS.ERROR,
                details: { error: error.message }
            });
        }
    },
    
    /**
     * Hide all content across enabled platforms
     * @returns {Promise} Promise resolving with operation results
     */
    hideAllContent: function() {
        return this._processAllContent(CONFIG.ACTIONS.HIDE);
    },
    
    /**
     * Restore all content across enabled platforms
     * @returns {Promise} Promise resolving with operation results
     */
    restoreAllContent: function() {
        return this._processAllContent(CONFIG.ACTIONS.RESTORE);
    },
    
    /**
     * Process all content (hide or restore) across enabled platforms
     * @param {string} action - Action to perform
     * @returns {Promise} Promise resolving with operation results
     */
    _processAllContent: async function(action) {
        const settings = StorageService.getSettings();
        const platforms = Object.keys(settings.platforms);
        const exceptedPosts = settings.exceptedPosts || [];
        
        const results = {
            success: true,
            platforms: {},
            stats: {
                total: 0,
                successful: 0,
                failed: 0
            }
        };
        
        // Process each enabled and connected platform
        for (const platform of platforms) {
            const platformConfig = settings.platforms[platform];
            
            // Skip disabled or not connected platforms
            if (!platformConfig.enabled || !platformConfig.connected) {
                continue;
            }
            
            try {
                Logger.info(`Processing ${action} for ${platform}`);
                
                // Get content items
                const contentItems = await ApiService.getContentItems(platform);
                const items = this._normalizeContentItems(platform, contentItems);
                
                // Filter out excepted posts
                const itemsToProcess = items.filter(item => {
                    return !exceptedPosts.some(exceptedPost => 
                        exceptedPost.platform === platform && exceptedPost.id === item.id
                    );
                });
                
                results.stats.total += itemsToProcess.length;
                
                // Process each item
                const platformResults = {
                    success: true,
                    items: {
                        total: itemsToProcess.length,
                        processed: 0,
                        failed: 0
                    },
                    errors: []
                };
                
                for (const item of itemsToProcess) {
                    try {
                        await ApiService.updateContentVisibility(platform, item.id, action);
                        platformResults.items.processed++;
                        results.stats.successful++;
                    } catch (error) {
                        platformResults.items.failed++;
                        platformResults.errors.push({
                            itemId: item.id,
                            error: error.message
                        });
                        results.stats.failed++;
                    }
                }
                
                platformResults.success = platformResults.items.failed === 0;
                results.platforms[platform] = platformResults;
                
                if (!platformResults.success) {
                    results.success = false;
                }
                
                Logger.info(`Completed ${action} for ${platform}`, platformResults);
                
            } catch (error) {
                Logger.error(`Failed to process ${action} for ${platform}`, { error: error.message });
                
                results.platforms[platform] = {
                    success: false,
                    error: error.message
                };
                
                results.success = false;
            }
        }
        
        return results;
    },
    
    /**
     * Normalize content items from different platforms to a common format
     * @param {string} platform - Platform name
     * @param {Object} data - Platform-specific content data
     * @returns {Array} Array of normalized content items
     */
    _normalizeContentItems: function(platform, data) {
        let items = [];
        
        switch (platform) {
            case 'facebook':
                items = data.data.map(post => ({
                    id: post.id,
                    content: post.message,
                    created: post.created_time,
                    url: post.permalink_url,
                    image: post.full_picture
                }));
                break;
                
            case 'instagram':
                items = data.data.map(post => ({
                    id: post.id,
                    content: post.caption,
                    created: post.timestamp,
                    url: post.permalink,
                    image: post.media_url
                }));
                break;
                
            case 'youtube':
                items = data.items.map(video => ({
                    id: video.id,
                    content: video.snippet.title,
                    created: video.snippet.publishedAt,
                    url: `https://www.youtube.com/watch?v=${video.id}`,
                    image: video.snippet.thumbnails.default.url
                }));
                break;
                
            case 'tiktok':
                items = data.data.videos.map(video => ({
                    id: video.id,
                    content: video.video_description,
                    created: video.create_time,
                    url: video.share_url,
                    image: video.cover_image_url
                }));
                break;
                
            default:
                Logger.warn(`Unknown platform: ${platform}`);
        }
        
        return items;
    }
};

// Expose the SchedulerService object globally
window.SchedulerService = SchedulerService;