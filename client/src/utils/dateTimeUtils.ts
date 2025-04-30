/**
 * Date and time utility functions for Shabbat Robot
 */

export class DateTimeUtils {
  /**
   * Format a date to a readable string
   * @param {Date} date - The date to format
   * @param {boolean} includeTime - Whether to include time in the formatted string
   * @returns {string} Formatted date string
   */
  static formatDate(date: Date, includeTime = false): string {
    if (!date) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    let formattedDate = `${day}/${month}/${year}`;
    
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      formattedDate += ` ${hours}:${minutes}`;
    }
    
    return formattedDate;
  }
  
  /**
   * Parse a time string to create a Date object
   * @param {string} timeStr - Time string in format "HH:MM"
   * @param {Date} dateObj - Optional date object to use as base
   * @returns {Date} Date object with the specified time
   */
  static parseTime(timeStr: string, dateObj: Date | null = null): Date | null {
    if (!timeStr) return null;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = dateObj || new Date();
    
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    return date;
  }
  
  /**
   * Get the next occurrence of a day of week
   * @param {number} dayOfWeek - Day of week (0-6, where 0 is Sunday)
   * @param {Date} fromDate - Reference date
   * @returns {Date} Next occurrence date
   */
  static getNextDayOfWeek(dayOfWeek: number, fromDate = new Date()): Date {
    const date = new Date(fromDate);
    const currentDay = date.getDay();
    
    const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    date.setDate(date.getDate() + daysToAdd);
    
    return date;
  }
  
  /**
   * Calculate the next Shabbat enter time
   * @param {string} enterTime - Enter time in format "HH:MM"
   * @param {string} timeZone - Time zone string
   * @returns {Date} Next Shabbat enter time
   */
  static getNextShabbatEnter(enterTime: string, timeZone: string): Date | null {
    // Get next Friday (day 5)
    const nextFriday = this.getNextDayOfWeek(5);
    return this.parseTime(enterTime, nextFriday);
  }
  
  /**
   * Calculate the next Shabbat exit time
   * @param {string} exitTime - Exit time in format "HH:MM"
   * @param {string} timeZone - Time zone string
   * @returns {Date} Next Shabbat exit time
   */
  static getNextShabbatExit(exitTime: string, timeZone: string): Date | null {
    // Get next Saturday (day 6)
    const nextSaturday = this.getNextDayOfWeek(6);
    return this.parseTime(exitTime, nextSaturday);
  }
  
  /**
   * Check if a date is between Shabbat enter and exit times
   * @param {Date} date - Date to check
   * @param {Date} enterTime - Shabbat enter time
   * @param {Date} exitTime - Shabbat exit time
   * @returns {boolean} True if date is during Shabbat
   */
  static isDuringShabbat(date: Date, enterTime: Date, exitTime: Date): boolean {
    return date >= enterTime && date <= exitTime;
  }
  
  /**
   * Get time remaining until a target date
   * @param {Date} targetDate - Target date
   * @returns {Object} Object with days, hours, minutes, seconds
   */
  static getTimeRemaining(targetDate: Date): {
    total: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } {
    const total = targetDate.getTime() - new Date().getTime();
    
    if (total <= 0) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    return {
      total,
      days,
      hours,
      minutes,
      seconds
    };
  }
  
  /**
   * Format time remaining in a human-readable format
   * @param {Object} timeRemaining - Object with time remaining components
   * @returns {string} Formatted time remaining
   */
  static formatTimeRemaining(timeRemaining: {
    total: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }): string {
    if (timeRemaining.total <= 0) {
      return 'עכשיו';
    }
    
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days} ימים, ${timeRemaining.hours} שעות`;
    }
    
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours} שעות, ${timeRemaining.minutes} דקות`;
    }
    
    return `${timeRemaining.minutes} דקות`;
  }

  /**
   * Convert a Date object to ISO string with the specified timezone
   * @param {Date} date - The date to convert
   * @param {string} timeZone - Time zone string
   * @returns {string} ISO string with timezone
   */
  static toISOStringWithTZ(date: Date, timeZone = 'Asia/Jerusalem'): string {
    const options: Intl.DateTimeFormatOptions = { timeZone };
    return date.toLocaleString('en-CA', {
      ...options,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
  }

  /**
   * Get a formatted string for day of week (e.g., "יום שישי")
   * @param {Date} date - The date
   * @returns {string} The Hebrew day name
   */
  static getHebrewDayName(date: Date): string {
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return `יום ${dayNames[date.getDay()]}`;
  }
}

export default DateTimeUtils;
