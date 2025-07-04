const DOMPurify = require('isomorphic-dompurify');

/**
 * XSS Prevention and Input Sanitization Utility
 * Provides comprehensive text sanitization for preventing XSS attacks
 */
class XSSSanitizer {
  /**
   * Sanitize HTML content - removes all potentially dangerous elements
   * @param {string} input - Raw HTML input
   * @returns {string} Sanitized HTML
   */
  static sanitizeHtml(input) {
    if (!input || typeof input !== 'string') return input;

    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
    });
  }

  /**
   * Sanitize plain text - escapes HTML entities and removes scripts
   * @param {string} input - Raw text input
   * @returns {string} Sanitized text
   */
  static sanitizeText(input) {
    if (!input || typeof input !== 'string') return input;

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  /**
   * Sanitize name fields (restaurant names, location names, etc.)
   * Allows basic characters but prevents script injection
   * @param {string} input - Name input
   * @returns {string} Sanitized name
   */
  static sanitizeName(input) {
    if (!input || typeof input !== 'string') return input;

    // Remove script tags and dangerous characters
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/&lt;script/gi, '')
      .replace(/&lt;\/script/gi, '');

    // Basic HTML entity encoding for safety
    sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();

    return sanitized;
  }

  /**
   * Sanitize URL-safe strings (like url_name)
   * @param {string} input - URL input
   * @returns {string} Sanitized URL
   */
  static sanitizeUrl(input) {
    if (!input || typeof input !== 'string') return input;

    // URL names should only contain safe characters
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .trim();
  }

  /**
   * Sanitize address fields
   * @param {string} input - Address input
   * @returns {string} Sanitized address
   */
  static sanitizeAddress(input) {
    if (!input || typeof input !== 'string') return input;

    // Address fields need to allow more characters but still be safe
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
  }

  /**
   * Sanitize array of strings
   * @param {Array} input - Array of strings
   * @returns {Array} Array of sanitized strings
   */
  static sanitizeArray(input) {
    if (!Array.isArray(input)) return input;

    return input.map((item) => {
      if (typeof item === 'string') {
        return this.sanitizeText(item);
      }
      return item;
    });
  }

  /**
   * Comprehensive sanitization for restaurant location data
   * @param {Object} data - Location data object
   * @returns {Object} Sanitized data object
   */
  static sanitizeLocationData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    // Sanitize text fields that could contain user input
    if (sanitized.name) sanitized.name = this.sanitizeName(sanitized.name);
    if (sanitized.url_name) sanitized.url_name = this.sanitizeUrl(sanitized.url_name);
    if (sanitized.address_street)
      sanitized.address_street = this.sanitizeAddress(sanitized.address_street);
    if (sanitized.address_complement)
      sanitized.address_complement = this.sanitizeAddress(sanitized.address_complement);
    if (sanitized.address_city)
      sanitized.address_city = this.sanitizeAddress(sanitized.address_city);
    if (sanitized.address_state)
      sanitized.address_state = this.sanitizeAddress(sanitized.address_state);
    if (sanitized.selected_features)
      sanitized.selected_features = this.sanitizeArray(sanitized.selected_features);

    return sanitized;
  }

  /**
   * Comprehensive sanitization for restaurant data
   * @param {Object} data - Restaurant data object
   * @returns {Object} Sanitized data object
   */
  static sanitizeRestaurantData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    // Sanitize text fields that could contain user input
    if (sanitized.owner_name) sanitized.owner_name = this.sanitizeName(sanitized.owner_name);
    if (sanitized.restaurant_name)
      sanitized.restaurant_name = this.sanitizeName(sanitized.restaurant_name);
    if (sanitized.restaurant_url_name)
      sanitized.restaurant_url_name = this.sanitizeUrl(sanitized.restaurant_url_name);
    if (sanitized.description) sanitized.description = this.sanitizeText(sanitized.description);
    if (sanitized.website) sanitized.website = this.sanitizeText(sanitized.website);

    return sanitized;
  }
}

module.exports = XSSSanitizer;
