const BaseModel = require('./BaseModel');
const Joi = require('joi');
const crypto = require('crypto');

/**
 * Payment Info Model
 * Handles secure payment information storage with tokenization
 * WARNING: This is a simplified implementation. In production, use a payment processor
 * like Stripe, PayPal, or similar services for PCI compliance.
 */
class PaymentInfoModel extends BaseModel {
  constructor() {
    super();
    this.tableName = 'payment_info';
    this.sensitiveFields = ['card_token']; // Don't expose real card tokens
  }

  /**
   * Validation schema for payment info creation
   */
  get createSchema() {
    return Joi.object({
      restaurant_id: Joi.number().integer().positive().required(),
      card_number: Joi.string()
        .pattern(/^\d{13,19}$/)
        .required(), // Will be tokenized, never stored
      cardholder_name: Joi.string().trim().min(2).max(255).required(),
      expiry_month: Joi.number().integer().min(1).max(12).required(),
      expiry_year: Joi.number().integer().min(new Date().getFullYear()).required(),
      cvv: Joi.string()
        .pattern(/^\d{3,4}$/)
        .required(), // Will be discarded after validation
    });
  }

  /**
   * Validation schema for payment info updates
   */
  get updateSchema() {
    return Joi.object({
      cardholder_name: Joi.string().trim().min(2).max(255),
      expiry_month: Joi.number().integer().min(1).max(12),
      expiry_year: Joi.number().integer().min(new Date().getFullYear()),
      is_active: Joi.boolean(),
    });
  }

  /**
   * Create or update payment info for restaurant
   * @param {Object} paymentData - Payment data
   * @returns {Object} Created/Updated payment info (sanitized)
   */
  async createOrUpdate(paymentData) {
    // Validate input data
    const validatedData = await this.validate(paymentData, this.createSchema);

    // Check if restaurant exists
    const restaurantExists = await this.checkRestaurantExists(validatedData.restaurant_id);
    if (!restaurantExists) {
      throw new Error('Restaurant not found');
    }

    // Validate card number using Luhn algorithm
    if (!this.validateCardNumber(validatedData.card_number)) {
      throw new Error('Invalid card number');
    }

    // Validate expiry date
    if (!this.validateExpiryDate(validatedData.expiry_month, validatedData.expiry_year)) {
      throw new Error('Card has expired or invalid expiry date');
    }

    // Determine card type
    const cardType = this.getCardType(validatedData.card_number);

    // Generate secure token (simulate payment processor tokenization)
    const cardToken = this.generateCardToken();

    // Extract last 4 digits
    const lastFourDigits = validatedData.card_number.slice(-4);

    // Prepare data for storage (never store actual card number or CVV)
    const storageData = {
      restaurant_id: validatedData.restaurant_id,
      card_token: cardToken,
      cardholder_name: validatedData.cardholder_name,
      last_four_digits: lastFourDigits,
      card_type: cardType,
      expiry_month: validatedData.expiry_month,
      expiry_year: validatedData.expiry_year,
      is_active: true,
    };

    // Check if payment info already exists for this restaurant
    const existingPayment = await this.getActiveByRestaurantId(validatedData.restaurant_id);

    if (existingPayment) {
      // Deactivate existing payment info first
      await this.deactivateAllForRestaurant(validatedData.restaurant_id);
    }

    // Create new payment info
    const columns = Object.keys(storageData);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const values = Object.values(storageData);

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING id, restaurant_id, cardholder_name, last_four_digits,
                card_type, expiry_month, expiry_year, is_active,
                created_at, updated_at
    `;

    const result = await this.executeQuery(query, values);
    return result.rows[0];
  }

  /**
   * Get active payment info by restaurant ID
   * @param {Number} restaurantId - Restaurant ID
   * @returns {Object|null} Payment info (sanitized)
   */
  async getActiveByRestaurantId(restaurantId) {
    const conditions = {
      restaurant_id: restaurantId,
      is_active: true,
    };

    const columns = [
      'id',
      'restaurant_id',
      'cardholder_name',
      'last_four_digits',
      'card_type',
      'expiry_month',
      'expiry_year',
      'is_active',
      'created_at',
      'updated_at',
    ];

    const result = await this.find(conditions, { orderBy: 'created_at DESC' }, columns);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update payment info
   * @param {Number} id - Payment info ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated payment info
   */
  async update(id, updateData) {
    // Validate update data
    const validatedData = await this.validate(updateData, this.updateSchema);

    if (Object.keys(validatedData).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Validate expiry date if provided
    if (validatedData.expiry_month || validatedData.expiry_year) {
      const currentPayment = await this.findById(id, ['expiry_month', 'expiry_year']);
      if (!currentPayment) {
        throw new Error('Payment info not found');
      }

      const month = validatedData.expiry_month || currentPayment.expiry_month;
      const year = validatedData.expiry_year || currentPayment.expiry_year;

      if (!this.validateExpiryDate(month, year)) {
        throw new Error('Invalid expiry date');
      }
    }

    const { clause, params } = this.buildSetClause(validatedData);
    const query = `
      UPDATE ${this.tableName}
      SET ${clause}
      WHERE id = $${params.length + 1}
      RETURNING id, restaurant_id, cardholder_name, last_four_digits,
                card_type, expiry_month, expiry_year, is_active,
                created_at, updated_at
    `;

    const result = await this.executeQuery(query, [...params, id]);
    return result.rows[0] || null;
  }

  /**
   * Deactivate payment info
   * @param {Number} id - Payment info ID
   * @returns {Boolean} Success status
   */
  async deactivate(id) {
    const query = `
      UPDATE ${this.tableName}
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    const result = await this.executeQuery(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Deactivate all payment info for restaurant
   * @param {Number} restaurantId - Restaurant ID
   * @returns {Number} Number of deactivated records
   * @private
   */
  async deactivateAllForRestaurant(restaurantId) {
    const query = `
      UPDATE ${this.tableName}
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE restaurant_id = $1
    `;

    const result = await this.executeQuery(query, [restaurantId]);
    return result.rowCount;
  }

  /**
   * Get payment history for restaurant
   * @param {Number} restaurantId - Restaurant ID
   * @param {Object} pagination - Pagination options
   * @returns {Object} Payment history
   */
  async getPaymentHistory(restaurantId, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const columns = [
      'id',
      'cardholder_name',
      'last_four_digits',
      'card_type',
      'expiry_month',
      'expiry_year',
      'is_active',
      'created_at',
      'updated_at',
    ];

    const conditions = { restaurant_id: restaurantId };
    const options = {
      orderBy: 'created_at DESC',
      limit,
      offset,
    };

    const payments = await this.find(conditions, options, columns);

    // Get total count
    const total = await this.count(conditions);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Validate card number using Luhn algorithm
   * @param {String} cardNumber - Card number to validate
   * @returns {Boolean} Validation result
   * @private
   */
  validateCardNumber(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
      return false;
    }

    // Remove any non-digit characters
    const digits = cardNumber.replace(/\D/g, '');

    // Check length (13-19 digits for most cards)
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let alternate = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);

      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + 1;
        }
      }

      sum += digit;
      alternate = !alternate;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate expiry date
   * @param {Number} month - Expiry month (1-12)
   * @param {Number} year - Expiry year (full year)
   * @returns {Boolean} Validation result
   * @private
   */
  validateExpiryDate(month, year) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

    // Check if year is in the past
    if (year < currentYear) {
      return false;
    }

    // If current year, check if month is in the past
    if (year === currentYear && month < currentMonth) {
      return false;
    }

    // Check if expiry is too far in the future (more than 10 years)
    if (year > currentYear + 10) {
      return false;
    }

    return true;
  }

  /**
   * Determine card type from card number
   * @param {String} cardNumber - Card number
   * @returns {String} Card type
   * @private
   */
  getCardType(cardNumber) {
    const patterns = {
      Visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
      Mastercard: /^5[1-5][0-9]{14}$/,
      'American Express': /^3[47][0-9]{13}$/,
      Discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
      'Diners Club': /^3[0689][0-9]{11}$/,
      JCB: /^(?:2131|1800|35\d{3})\d{11}$/,
    };

    const digits = cardNumber.replace(/\D/g, '');

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(digits)) {
        return type;
      }
    }

    return 'Unknown';
  }

  /**
   * Generate secure card token
   * @returns {String} Secure token
   * @private
   */
  generateCardToken() {
    // In production, this would be handled by a payment processor
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `tok_${timestamp}_${randomBytes}`;
  }

  /**
   * Check if restaurant exists
   * @param {Number} restaurantId - Restaurant ID
   * @returns {Boolean} Existence status
   * @private
   */
  async checkRestaurantExists(restaurantId) {
    const query = 'SELECT 1 FROM restaurants WHERE id = $1';
    const result = await this.executeQuery(query, [restaurantId]);
    return result.rows.length > 0;
  }

  /**
   * Get masked card number for display
   * @param {String} lastFourDigits - Last 4 digits of card
   * @param {String} cardType - Card type
   * @returns {String} Masked card number
   */
  getMaskedCardNumber(lastFourDigits, cardType) {
    const cardPatterns = {
      'American Express': '**** ****** *',
      'Diners Club': '**** ****** ',
      default: '**** **** **** ',
    };

    const pattern = cardPatterns[cardType] || cardPatterns.default;
    return pattern + lastFourDigits;
  }

  /**
   * Check if card is expired
   * @param {Number} month - Expiry month
   * @param {Number} year - Expiry year
   * @returns {Boolean} Expiry status
   */
  isCardExpired(month, year) {
    return !this.validateExpiryDate(month, year);
  }

  /**
   * Get cards expiring soon (within 30 days)
   * @param {Number} restaurantId - Restaurant ID (optional)
   * @returns {Array} Cards expiring soon
   */
  async getCardsExpiringSoon(restaurantId = null) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nextMonthYear = nextMonth.getFullYear();
    const nextMonthMonth = nextMonth.getMonth() + 1;

    let query = `
      SELECT id, restaurant_id, cardholder_name, last_four_digits,
             card_type, expiry_month, expiry_year, created_at
      FROM ${this.tableName}
      WHERE is_active = true
        AND (
          (expiry_year = $1 AND expiry_month = $2) OR
          (expiry_year = $3 AND expiry_month = $4)
        )
    `;

    const params = [currentYear, currentMonth, nextMonthYear, nextMonthMonth];

    if (restaurantId) {
      query += ` AND restaurant_id = $${params.length + 1}`;
      params.push(restaurantId);
    }

    query += ' ORDER BY expiry_year, expiry_month';

    const result = await this.executeQuery(query, params);
    return result.rows;
  }
}

module.exports = new PaymentInfoModel();
