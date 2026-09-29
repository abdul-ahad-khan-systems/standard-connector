// Normalized Error Contract
// All errors are normalized to a standard form

const ERROR_CATEGORIES = Object.freeze([
  'COMPATIBILITY',
  'ADAPTER',
  'SUB_CONNECTOR',
  'LIFECYCLE',
  'VERSION',
  'VALIDATION',
  'RESOLUTION',
  'UNEXPECTED'
]);

class StandardError extends Error {
  /**
   * @param {Object} options
   * @param {string} options.code } - stable, deterministic error code
   * @param { 'COMPATIBILITY'|'ADAPTER'|'SUB_CONNECTOR'|'LIFECYCLE'|'VERSION'|'VALIDATION'|'RESOLUTION'|'UNEXPECTED' } options.category - error category
   * @param {string} options.message - human-readable message
   * @param {Object} [options.cause] - optional structured cause
   * @param {boolean} [options.recoverable=false] - whether the error is recoverable
   */
  constructor(options) {
    if (!options || !options.code || typeof options.code !== 'string') {
      throw new Error('StandardError requires a string code');
    }
    if (!options.category || !ERROR_CATEGORIES.includes(options.category)) {
      throw new Error(`StandardError requires a valid category: one of ${ERROR_CATEGORIES.join(', ')}`);
    }
    if (!options.message || typeof options.message !== 'string') {
      throw new Error('StandardError requires a string message');
    }

    super(options.message);
    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StandardError);
    }

    this.name = this.constructor.name;
    this.code = options.code;
    this.category = options.category;
    this.message = options.message;
    this.cause = options.cause !== undefined ? options.cause : null;
    this.recoverable = options.recoverable !== undefined ? options.recoverable : false;
  }
}

module.exports = {
  StandardError,
  ERROR_CATEGORIES
};