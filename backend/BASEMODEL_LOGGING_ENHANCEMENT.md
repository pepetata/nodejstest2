# BaseModel Logging Enhancement

## Overview

Enhanced the BaseModel with comprehensive logging capabilities to improve debugging, monitoring, and security auditing across all models.

## Changes Made

### 1. Logger Integration

- Added logger import: `const { logger } = require('../utils/logger');`
- Added logger instance to constructor: `this.logger = logger.child({ model: this.constructor.name });`
- Each model instance gets a child logger with model name context

### 2. Database Query Logging

Enhanced `executeQuery()` method with:

- **Performance Monitoring**: Query execution time tracking
- **Debug Information**: Query text (sanitized), parameter count, table name
- **Success Logging**: Row count affected, execution duration
- **Error Logging**: Detailed error information without exposing sensitive data

### 3. Validation Logging

Enhanced `validate()` method with:

- **Debug Information**: Field count being validated
- **Validation Failures**: Structured error logging with field names and messages
- **Success Confirmation**: Validated field count

### 4. Transaction Logging

Enhanced transaction methods with:

- **Transaction Lifecycle**: Begin, commit, rollback events
- **Transaction Queries**: Query execution within transactions
- **Error Tracking**: Failed transaction operations

## Benefits

### 🔍 **Debugging**

- Track query execution flow
- Identify performance bottlenecks
- Debug validation failures

### 🔒 **Security**

- Audit database access patterns
- Monitor validation failures (potential attacks)
- Track transaction rollbacks

### 📊 **Performance**

- Query execution time monitoring
- Identify slow queries
- Database connection issues

### 🚨 **Monitoring**

- Structured logging for log aggregation tools
- Model-specific context in all logs
- Consistent error reporting

## Log Structure Example

```javascript
// Successful query
{
  "level": "debug",
  "model": "RestaurantLocationModel",
  "table": "restaurant_locations",
  "query": "SELECT * FROM restaurant_locations WHERE id = $1",
  "paramCount": 1,
  "rowsAffected": 1,
  "duration": "15ms",
  "message": "Database query completed successfully"
}

// Validation failure
{
  "level": "warn",
  "model": "RestaurantLocationModel",
  "table": "restaurant_locations",
  "errors": [
    {
      "field": "name",
      "message": "name is required"
    }
  ],
  "message": "Data validation failed"
}
```

## Security Considerations

- Query parameters are not logged to prevent sensitive data exposure
- Only sanitized query text is logged
- Error messages don't expose database schema details
- Sensitive validation values are excluded from logs

## Testing

- Updated mock BaseModel in tests to include logger property
- All existing tests pass without modification
- Logging doesn't impact performance significantly
