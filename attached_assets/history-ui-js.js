/**
 * History UI handler for Shabbat Robot
 * Manages the history UI components and interactions
 */

const HistoryUI = {
    // DOM elements
    elements: {
        section: null,
        platformSelect: null,
        actionSelect: null,
        dateInput: null,
        filterBtn: null,
        tableBody: null
    },
    
    // Current filter
    filter: {
        platform: 'all',
        action: 'all',
        date: ''
    },
    
    /**
     * Initialize history UI
     */
    initialize: function() {
        // Get DOM elements
        this.elements.section = document.getElementById('history-section');
        
        if (!this.elements.section) {
            Logger.error('History section not found');
            return;
        }
        
        this.elements.platformSelect = document.getElementById('history-platform');
        this.elements.actionSelect = document.getElementById('history-action');
        this.elements.dateInput = document.getElementById('history-date');
        this.elements.filterBtn = document.getElementById('filter-history');
        this.elements.tableBody = document.getElementById('history-table-body');
        
        // Add event listeners
        if (this.elements.filterBtn) {
            this.elements.filterBtn.addEventListener('click', this.handleFilterHistory.bind(this));
        }
        
        // Set initial date to today
        if (this.elements.dateInput) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            this.elements.dateInput.value = formattedDate;
        }
        
        // Load history
        this.loadHistory();
    },
    
    /**
     * Load history with current filter
     */
    loadHistory: function() {
        if (!this.elements.tableBody) {
            return;
        }
        
        // Get filter values
        if (this.elements.platformSelect) {
            this.filter.platform = this.elements.platformSelect.value;
        }
        
        if (this.elements.actionSelect) {
            this.filter.action = this.elements.actionSelect.value;
        }
        
        if (this.elements.dateInput) {
            this.filter.date = this.elements.dateInput.value;
        }
        
        // Get history entries
        const history = StorageService.getHistory();
        
        // Apply filters
        const filteredHistory = this.filterHistory(history, this.filter);
        
        // Render history table
        this.renderHistoryTable(filteredHistory);
    },
    
    /**
     * Filter history entries
     * @param {Array} history - History entries
     * @param {Object} filter - Filter criteria
     * @returns {Array} Filtered history entries
     */
    filterHistory: function(history, filter) {
        return history.filter(entry => {
            // Filter by platform
            if (filter.platform !== 'all') {
                if (!entry.platforms || !entry.platforms[filter.platform]) {
                    return false;
                }
            }
            
            // Filter by action
            if (filter.action !== 'all' && entry.action !== filter.action) {
                return false;
            }
            
            // Filter by date
            if (filter.date) {
                const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
                if (entryDate !== filter.date) {
                    return false;
                }
            }
            
            return true;
        });
    },
    
    /**
     * Render history table
     * @param {Array} historyEntries - History entries to render
     */
    renderHistoryTable: function(historyEntries) {
        if (!this.elements.tableBody) {
            return;
        }
        
        if (historyEntries.length === 0) {
            this.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-history">לא נמצאו רשומות היסטוריה</td>
                </tr>
            `;
            return;
        }
        
        // Render table rows
        const rows = historyEntries.map(entry => {
            const timestamp = new Date(entry.timestamp);
            const formattedDate = DateTimeUtils.formatDate(timestamp, true);
            
            // Get action text
            let actionText;
            switch (entry.action) {
                case CONFIG.ACTIONS.HIDE:
                    actionText = 'הסתרת תוכן';
                    break;
                case CONFIG.ACTIONS.RESTORE:
                    actionText = 'שחזור תוכן';
                    break;
                case CONFIG.ACTIONS.TEST:
                    actionText = 'בדיקת חיבור';
                    break;
                default:
                    actionText = entry.action || 'לא ידוע';
            }
            
            // Get platforms text
            let platformsText = 'כל הפלטפורמות';
            if (entry.platforms) {
                const platformNames = Object.keys(entry.platforms);
                if (platformNames.length > 0) {
                    const platformDisplayNames = platformNames.map(name => {
                        switch (name) {
                            case 'facebook': return 'פייסבוק';
                            case 'instagram': return 'אינסטגרם';
                            case 'youtube': return 'יוטיוב';
                            case 'tiktok': return 'טיקטוק';
                            default: return name;
                        }
                    });
                    platformsText = platformDisplayNames.join(', ');
                }
            }
            
            // Get status class and text
            let statusClass, statusText;
            if (entry.status === CONFIG.STATUS.SUCCESS) {
                statusClass = 'status-success';
                statusText = 'הושלם';
            } else if (entry.status === CONFIG.STATUS.ERROR) {
                statusClass = 'status-error';
                statusText = 'שגיאה';
            } else {
                statusClass = 'status-pending';
                statusText = 'בתהליך';
            }
            
            return `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${actionText}</td>
                    <td>${platformsText}</td>
                    <td class="${statusClass}">${statusText}</td>
                    <td><button class="btn btn-sm btn-outline" data-id="${entry.id}">פרטים</button></td>
                </tr>
            `;
        }).join('');
        
        this.elements.tableBody.innerHTML = rows;
        
        // Add event listeners to details buttons
        const detailButtons = this.elements.tableBody.querySelectorAll('button[data-id]');
        detailButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.showDetailsModal(button.getAttribute('data-id'));
            });
        });
    },
    
    /**
     * Handle filter history button click
     */
    handleFilterHistory: function() {
        this.loadHistory();
    },
    
    /**
     * Show details modal for a history entry
     * @param {string} entryId - History entry ID
     */
    showDetailsModal: function(entryId) {
        // Find the entry
        const history = StorageService.getHistory();
        const entry = history.find(item => item.id === entryId);
        
        if (!entry) {
            DashboardUI.showNotification('שגיאה', 'רשומת היסטוריה לא נמצאה', 'error');
            return;
        }
        
        // Get modal elements
        const modal = document.getElementById('details-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        if (!modal || !modalBody) {
            return;
        }
        
        // Format timestamp
        const timestamp = new Date(entry.timestamp);
        const formattedDate = DateTimeUtils.formatDate(timestamp, true);
        
        // Get action text
        let actionText;
        switch (entry.action) {
            case CONFIG.ACTIONS.HIDE:
                actionText = 'הסתרת תוכן';
                break;
            case CONFIG.ACTIONS.RESTORE:
                actionText = 'שחזור תוכן';
                break;
            case CONFIG.ACTIONS.TEST:
                actionText = 'בדיקת חיבור';
                break;
            default:
                actionText = entry.action || 'לא ידוע';
        }
        
        // Get status text
        let statusText, statusClass;
        if (entry.status === CONFIG.STATUS.SUCCESS) {
            statusText = 'הושלם';
            statusClass = 'status-success';
        } else if (entry.status === CONFIG.STATUS.ERROR) {
            statusText = 'שגיאה';
            statusClass = 'status-error';
        } else {
            statusText = 'בתהליך';
            statusClass = 'status-pending';
        }
        
        // Build details HTML
        let detailsHTML = `
            <div class="details-header">
                <div class="details-row">
                    <div class="details-label">תאריך ושעה:</div>
                    <div class="details-value">${formattedDate}</div>
                </div>
                <div class="details-row">
                    <div class="details-label">פעולה:</div>
                    <div class="details-value">${actionText}</div>
                </div>
                <div class="details-row">
                    <div class="details-label">סטטוס:</div>
                    <div class="details-value ${statusClass}">${statusText}</div>
                </div>
            </div>
        `;
        
        // Add platform-specific details
        if (entry.platforms) {
            detailsHTML += '<div class="details-platforms">';
            detailsHTML += '<h4>פרטי פלטפורמות</h4>';
            
            Object.keys(entry.platforms).forEach(platform => {
                const platformResult = entry.platforms[platform];
                let platformName;
                
                switch (platform) {
                    case 'facebook': platformName = 'פייסבוק'; break;
                    case 'instagram': platformName = 'אינסטגרם'; break;
                    case 'youtube': platformName = 'יוטיוב'; break;
                    case 'tiktok': platformName = 'טיקטוק'; break;
                    default: platformName = platform;
                }
                
                detailsHTML += `<div class="platform-result">`;
                detailsHTML += `<h5>${platformName}</h5>`;
                
                if (platformResult.success) {
                    detailsHTML += `<div class="result-status status-success">הצלחה</div>`;
                    
                    if (platformResult.items) {
                        detailsHTML += `
                            <div class="result-stats">
                                <div>סה"כ פריטים: ${platformResult.items.total}</div>
                                <div>פריטים שטופלו: ${platformResult.items.processed}</div>
                                <div>פריטים שדולגו: ${platformResult.items.skipped || 0}</div>
                                <div>פריטים שנכשלו: ${platformResult.items.failed}</div>
                            </div>
                        `;
                    }
                } else {
                    detailsHTML += `<div class="result-status status-error">נכשל</div>`;
                    
                    if (platformResult.error) {
                        detailsHTML += `<div class="error-message">${platformResult.error}</div>`;
                    }
                    
                    if (platformResult.errors && platformResult.errors.length > 0) {
                        detailsHTML += `<div class="error-details">`;
                        detailsHTML += `<h6>פרטי שגיאות</h6>`;
                        detailsHTML += `<ul>`;
                        
                        platformResult.errors.slice(0, 5).forEach(error => {
                            detailsHTML += `<li>${error.error}</li>`;
                        });
                        
                        if (platformResult.errors.length > 5) {
                            detailsHTML += `<li>+ ${platformResult.errors.length - 5} שגיאות נוספות</li>`;
                        }
                        
                        detailsHTML += `</ul>`;
                        detailsHTML += `</div>`;
                    }
                }
                
                detailsHTML += `</div>`;
            });
            
            detailsHTML += '</div>';
        }
        
        // Add error details if present
        if (entry.status === CONFIG.STATUS.ERROR && entry.details && entry.details.error) {
            detailsHTML += `
                <div class="details-error">
                    <h4>פרטי שגיאה</h4>
                    <div class="error-message">${entry.details.error}</div>
                </div>
            `;
        }
        
        // Set modal content
        modalBody.innerHTML = detailsHTML;
        
        // Show modal
        modal.style.display = 'block';
        
        // Add close event listeners
        const closeButtons = modal.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });
        
        // Close when clicking outside the modal
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
};

// Register the UI handler
window.HistoryUI = HistoryUI;