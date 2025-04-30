/**
 * Logger utility for Shabbat Robot application
 * Handles logging with different severity levels
 */

import CONFIG from "../config";

export class Logger {
  // Current log level
  private static _level: string = CONFIG.DEFAULT_LOG_LEVEL;
  
  // Log level hierarchy
  private static _levelHierarchy: Record<string, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  /**
   * Set logger level
   * @param {string} level - Log level (debug, info, warn, error)
   */
  static setLevel(level: string): void {
    if (Object.keys(this._levelHierarchy).includes(level)) {
      this._level = level;
    }
  }
  
  /**
   * Check if a log level should be displayed based on current log level
   * @param {string} level - Log level to check
   * @returns {boolean} True if the log should be displayed
   */
  private static _shouldLog(level: string): boolean {
    return this._levelHierarchy[level] >= this._levelHierarchy[this._level];
  }
  
  /**
   * Format a log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @returns {Object} Formatted log object
   */
  private static _formatLog(level: string, message: string, data: any): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
  }
  
  /**
   * Store log entry in local storage
   * @param {Object} logEntry - Log entry object
   */
  private static _storeLog(logEntry: Record<string, any>): void {
    try {
      // Get existing logs
      const storedLogs = JSON.parse(localStorage.getItem('shabbat_robot_logs') || '[]');
      
      // Add new log
      storedLogs.push(logEntry);
      
      // Limit logs to 1000 entries
      const limitedLogs = storedLogs.slice(-1000);
      
      // Save logs
      localStorage.setItem('shabbat_robot_logs', JSON.stringify(limitedLogs));
    } catch (error) {
      console.error('Failed to store log', error);
    }
  }
  
  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  static debug(message: string, data: any = null): void {
    if (this._shouldLog('debug')) {
      const logEntry = this._formatLog('debug', message, data);
      console.log(`[DEBUG] ${message}`, data);
      this._storeLog(logEntry);
    }
  }
  
  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  static info(message: string, data: any = null): void {
    if (this._shouldLog('info')) {
      const logEntry = this._formatLog('info', message, data);
      console.info(`[INFO] ${message}`, data);
      this._storeLog(logEntry);
    }
  }
  
  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  static warn(message: string, data: any = null): void {
    if (this._shouldLog('warn')) {
      const logEntry = this._formatLog('warn', message, data);
      console.warn(`[WARN] ${message}`, data);
      this._storeLog(logEntry);
    }
  }
  
  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  static error(message: string, data: any = null): void {
    if (this._shouldLog('error')) {
      const logEntry = this._formatLog('error', message, data);
      console.error(`[ERROR] ${message}`, data);
      this._storeLog(logEntry);
    }
  }
  
  /**
   * Get all stored logs
   * @returns {Array} Array of log entries
   */
  static getLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('shabbat_robot_logs') || '[]');
    } catch (error) {
      console.error('Failed to retrieve logs', error);
      return [];
    }
  }
  
  /**
   * Clear all stored logs
   */
  static clearLogs(): void {
    localStorage.removeItem('shabbat_robot_logs');
  }
}

export default Logger;
