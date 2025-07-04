const fs = require('fs');
const path = require('path');

/**
 * Logger utility with different log levels
 * Supports console output and file logging
 */
class Logger {
  constructor(options = {}) {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
    };

    this.colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      INFO: '\x1b[36m', // Cyan
      DEBUG: '\x1b[37m', // White
      RESET: '\x1b[0m', // Reset
    };

    this.logLevel = this.levels[options.level] || this.levels.INFO;
    this.enableFileLogging = options.enableFileLogging || false;
    this.logDirectory = options.logDirectory || path.join(process.cwd(), 'logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;

    // Create logs directory if file logging is enabled
    if (this.enableFileLogging) {
      this.ensureLogDirectory();
    }
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  /**
   * Format log message
   * @param {String} level - Log level
   * @param {String} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {String} Formatted log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;

    let logEntry = {
      timestamp,
      level,
      pid,
      message,
    };

    // Add metadata if provided
    if (Object.keys(meta).length > 0) {
      logEntry = Object.assign({}, logEntry, meta);
    }

    return JSON.stringify(logEntry);
  }

  /**
   * Format console message with colors
   * @param {String} level - Log level
   * @param {String} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {String} Formatted console message
   */
  formatConsoleMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = this.colors[level] || this.colors.RESET;
    const reset = this.colors.RESET;

    let consoleMessage = `${color}[${timestamp}] ${level}: ${message}${reset}`;

    if (Object.keys(meta).length > 0) {
      consoleMessage += `\n${color}${JSON.stringify(meta, null, 2)}${reset}`;
    }

    return consoleMessage;
  }

  /**
   * Write log to file
   * @param {String} level - Log level
   * @param {String} message - Log message
   * @param {Object} meta - Additional metadata
   */
  writeToFile(level, message, meta = {}) {
    if (!this.enableFileLogging) return;

    const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`;
    const logFilePath = path.join(this.logDirectory, logFileName);
    const formattedMessage = this.formatMessage(level, message, meta);

    try {
      // Check file size and rotate if necessary
      if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        if (stats.size > this.maxFileSize) {
          this.rotateLogFile(logFilePath);
        }
      }

      fs.appendFileSync(logFilePath, formattedMessage + '\n');
    } catch (error) {
      // Failed to write to log file - fallback to stderr
      process.stderr.write(`Failed to write to log file: ${error.message}\n`);
    }
  }

  /**
   * Rotate log file when it reaches max size
   * @param {String} logFilePath - Path to log file
   */
  rotateLogFile(logFilePath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = logFilePath.replace('.log', `-${timestamp}.log`);
      fs.renameSync(logFilePath, rotatedPath);

      // Clean up old log files
      this.cleanupOldLogs();
    } catch (error) {
      process.stderr.write(`Failed to rotate log file: ${error.message}\n`);
    }
  }

  /**
   * Clean up old log files beyond maxFiles limit
   */
  cleanupOldLogs() {
    try {
      const files = fs
        .readdirSync(this.logDirectory)
        .filter((file) => file.endsWith('.log'))
        .map((file) => ({
          name: file,
          path: path.join(this.logDirectory, file),
          ctime: fs.statSync(path.join(this.logDirectory, file)).ctime,
        }))
        .sort((a, b) => b.ctime - a.ctime);

      // Remove files beyond maxFiles limit
      if (files.length > this.maxFiles) {
        files.slice(this.maxFiles).forEach((file) => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      process.stderr.write(`Failed to cleanup old logs: ${error.message}\n`);
    }
  }

  /**
   * Log message at specified level
   * @param {String} level - Log level
   * @param {String} message - Log message
   * @param {Object} meta - Additional metadata
   */
  log(level, message, meta = {}) {
    const levelValue = this.levels[level];

    if (levelValue === undefined) {
      throw new Error(`Invalid log level: ${level}`);
    }

    if (levelValue <= this.logLevel) {
      // Console output
      process.stdout.write(this.formatConsoleMessage(level, message, meta) + '\n');

      // File output
      this.writeToFile(level, message, meta);
    }
  }

  /**
   * Log error message
   * @param {String} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  /**
   * Log warning message
   * @param {String} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  /**
   * Log info message
   * @param {String} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  /**
   * Log debug message
   * @param {String} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  /**
   * Create a child logger with additional context
   * @param {Object} context - Additional context for all logs
   * @returns {Object} Child logger instance
   */
  child(context = {}) {
    const parentLogger = this;

    return {
      error: (message, meta = {}) => parentLogger.error(message, Object.assign({}, context, meta)),
      warn: (message, meta = {}) => parentLogger.warn(message, Object.assign({}, context, meta)),
      info: (message, meta = {}) => parentLogger.info(message, Object.assign({}, context, meta)),
      debug: (message, meta = {}) => parentLogger.debug(message, Object.assign({}, context, meta)),
    };
  }
}

// Create default logger instance
const defaultLogger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  logDirectory: process.env.LOG_DIRECTORY || path.join(process.cwd(), 'logs'),
});

module.exports = {
  Logger,
  logger: defaultLogger,
};
