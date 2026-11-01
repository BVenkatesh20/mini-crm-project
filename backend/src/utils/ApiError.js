export default class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message   
   * @param {Array}  [errors]   
   */
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    if (errors) this.errors = errors;
  }
}
