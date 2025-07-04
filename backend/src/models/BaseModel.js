/* eslint-disable no-console */
const db = require('../config/db');

/**
 * Base Model Class
 * Provides common functionality for all models with security best practices
 */
class BaseModel {
  constructor() {
    this.tableName = '';
    this.primaryKey = 'id';
    this.timestamps = true;
    this.softDeletes = false;
  }

  /**
   * Validate data against Joi schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Joi validation schema
   * @returns {Object} Validated data
   * @throws {Error} Validation error
   */
  async validate(data, schema) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const validationError = new Error('Validation failed');
      validationError.details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));
      throw validationError;
    }

    return value;
  }

  /**
   * Build WHERE clause with parameterized queries
   * @param {Object} conditions - Key-value pairs for WHERE conditions
   * @param {Number} startIndex - Starting parameter index
   * @returns {Object} { clause, params, nextIndex }
   */
  buildWhereClause(conditions = {}, startIndex = 1) {
    const whereParts = [];
    const params = [];
    let paramIndex = startIndex;

    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle IN clause
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          whereParts.push(`${key} IN (${placeholders})`);
          params.push(...value);
        } else if (typeof value === 'object' && value.operator) {
          // Handle custom operators like { operator: '>=', value: 10 }
          whereParts.push(`${key} ${value.operator} $${paramIndex++}`);
          params.push(value.value);
        } else {
          // Handle equality
          whereParts.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      }
    });

    const clause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
    return { clause, params, nextIndex: paramIndex };
  }

  /**
   * Build SET clause for UPDATE queries
   * @param {Object} data - Data to update
   * @param {Number} startIndex - Starting parameter index
   * @returns {Object} { clause, params, nextIndex }
   */
  buildSetClause(data, startIndex = 1) {
    const setParts = [];
    const params = [];
    let paramIndex = startIndex;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        setParts.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    });

    if (this.timestamps) {
      setParts.push(`updated_at = CURRENT_TIMESTAMP`);
    }

    const clause = setParts.join(', ');
    return { clause, params, nextIndex: paramIndex };
  }

  /**
   * Execute query with error handling and logging
   * @param {String} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Object} Query result
   */
  async executeQuery(text, params = []) {
    try {
      const result = await db.query(text, params);
      return result;
    } catch (error) {
      // Log error details (without exposing sensitive data)
      console.error('Database query error:', {
        table: this.tableName,
        error: error.message,
        code: error.code,
      });

      // Throw sanitized error
      if (error.code === '23505') {
        const duplicateError = new Error('Duplicate entry found');
        duplicateError.code = 'DUPLICATE_ENTRY';
        throw duplicateError;
      } else if (error.code === '23503') {
        const foreignKeyError = new Error('Foreign key constraint violation');
        foreignKeyError.code = 'FOREIGN_KEY_VIOLATION';
        throw foreignKeyError;
      } else if (error.code === '23502') {
        const notNullError = new Error('Required field missing');
        notNullError.code = 'NOT_NULL_VIOLATION';
        throw notNullError;
      }

      throw error;
    }
  }

  /**
   * Generic find by ID
   * @param {Number} id - Record ID
   * @param {Array} columns - Columns to select
   * @returns {Object|null} Found record or null
   */
  async findById(id, columns = ['*']) {
    const columnList = columns.join(', ');
    const query = `SELECT ${columnList} FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;

    const result = await this.executeQuery(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Generic find with conditions
   * @param {Object} conditions - WHERE conditions
   * @param {Object} options - Query options (limit, offset, orderBy)
   * @param {Array} columns - Columns to select
   * @returns {Array} Found records
   */
  async find(conditions = {}, options = {}, columns = ['*']) {
    const columnList = columns.join(', ');
    const { clause, params } = this.buildWhereClause(conditions);

    let query = `SELECT ${columnList} FROM ${this.tableName} ${clause}`;

    // Add ORDER BY
    if (options.orderBy) {
      const validatedOrderBy = this.validateOrderBy(options.orderBy);
      query += ` ORDER BY ${validatedOrderBy}`;
    }

    // Add LIMIT and OFFSET
    if (options.limit) {
      query += ` LIMIT ${parseInt(options.limit)}`;
    }
    if (options.offset) {
      query += ` OFFSET ${parseInt(options.offset)}`;
    }

    const result = await this.executeQuery(query, params);
    return result.rows;
  }

  /**
   * Generic count with conditions
   * @param {Object} conditions - WHERE conditions
   * @returns {Number} Count of records
   */
  async count(conditions = {}) {
    const { clause, params } = this.buildWhereClause(conditions);
    const query = `SELECT COUNT(*) FROM ${this.tableName} ${clause}`;

    const result = await this.executeQuery(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Generic delete
   * @param {Object} conditions - WHERE conditions
   * @returns {Number} Number of deleted rows
   */
  async delete(conditions) {
    if (Object.keys(conditions).length === 0) {
      throw new Error('Delete conditions cannot be empty');
    }

    const { clause, params } = this.buildWhereClause(conditions);
    const query = `DELETE FROM ${this.tableName} ${clause}`;

    const result = await this.executeQuery(query, params);
    return result.rowCount;
  }

  /**
   * Begin transaction
   * @returns {Object} Transaction client
   */
  async beginTransaction() {
    const client = await db.getClient();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit transaction
   * @param {Object} client - Transaction client
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback transaction
   * @param {Object} client - Transaction client
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }

  /**
   * Execute query within transaction
   * @param {Object} client - Transaction client
   * @param {String} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Object} Query result
   */
  async executeInTransaction(client, text, params = []) {
    try {
      return await client.query(text, params);
    } catch (error) {
      console.error('Transaction query error:', {
        table: this.tableName,
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Sanitize output data (remove sensitive fields)
   * @param {Object} data - Data to sanitize
   * @param {Array} sensitiveFields - Fields to remove
   * @returns {Object} Sanitized data
   */
  sanitizeOutput(data, sensitiveFields = []) {
    if (!data) return data;

    const sanitized = Object.assign({}, data);
    sensitiveFields.forEach((field) => {
      delete sanitized[field];
    });

    return sanitized;
  }

  /**
   * Validate ORDER BY clause to prevent SQL injection
   * @param {String} orderBy - ORDER BY clause
   * @returns {String} Validated ORDER BY clause
   * @private
   */
  validateOrderBy(orderBy) {
    if (!orderBy) return null;

    // Allow only alphanumeric characters, underscores, spaces, commas, ASC, DESC
    const validOrderByPattern =
      /^[a-zA-Z0-9_,\s]+(\s+(ASC|DESC))?(\s*,\s*[a-zA-Z0-9_,\s]+(\s+(ASC|DESC))?)*$/i;

    if (!validOrderByPattern.test(orderBy)) {
      throw new Error('Invalid ORDER BY clause format');
    }

    return orderBy;
  }
}

module.exports = BaseModel;
