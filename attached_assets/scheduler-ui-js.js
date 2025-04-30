/**
 * Scheduler UI handler for Shabbat Robot
 * Manages scheduler UI components and interactions
 */

const SchedulerUI = {
    /**
     * Initialize scheduler UI
     */
    initialize: function() {
        // Nothing specific to initialize in scheduler UI yet
        // This is a placeholder for future scheduler-specific UI functionality
    },
    
    /**
     * Format next scheduled event for display
     * @param {Object} event - Scheduled event
     * @returns {string} Formatted event string
     */
    formatNextEvent: function(event) {
        if (!event || !event.time) {
            return 'אין אירוע מתוזמן';
        }
        
        const formattedDate = DateTimeUtils.formatDate(event.time, true);
        const timeRemaining = DateTimeUtils.getTimeRemaining(event.time);
        const formattedRemaining = DateTimeUtils.formatTimeRemaining(timeRemaining);
        
        const actionText = event.action === CONFIG.ACTIONS.HIDE ? 
            'הסתרת תוכן' : 'שחזור תוכן';
        
        return `${actionText} ב-${formattedDate} (${formattedRemaining})`;
    },
    
    /**
     * Get current scheduler status display
     * @returns {Object} Status display information
     */
    getStatusDisplay: function() {
        const isRunning = SchedulerService.isRunning();
        const nextEvents = SchedulerService.getNextEvents();
        
        let statusClass, statusIcon, statusText;
        
        if (isRunning) {
            statusClass = 'active';
            statusIcon = 'fas fa-check-circle';
            statusText = 'הרובוט מופעל ומוכן';
        } else {
            statusClass = 'inactive';
            statusIcon = 'fas fa-times-circle';
            statusText = 'הרובוט כבוי';
        }
        
        let nextActionText = 'אין פעולה מתוזמנת';
        let nextActionTime = '';
        
        if (isRunning && nextEvents) {
            if (nextEvents.hide && new Date() < nextEvents.hide.time) {
                nextActionText = 'הסתרת תוכן בכניסת שבת';
                nextActionTime = this.formatNextEvent(nextEvents.hide);
            } else if (nextEvents.restore && new Date() < nextEvents.restore.time) {
                nextActionText = 'שחזור תוכן במוצאי שבת';
                nextActionTime = this.formatNextEvent(nextEvents.restore);
            }
        }
        
        return {
            statusClass,
            statusIcon,
            statusText,
            nextActionText,
            nextActionTime,
            isRunning
        };
    }
};

// Register the UI handler
window.SchedulerUI = SchedulerUI;