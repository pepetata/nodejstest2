# API Versioning (v1) and Rate Limiting Implementation

## Overview

This document describes the implemented API versioning (v1) and rate limiting features for the Restaurant Ordering System backend.

## ✅ Implemented Features

### 1. API Versioning (v1)

#### Version Detection

The API supports multiple ways to specify the version:

1. **URL Path** (Primary): `/api/v1/...`
2. **Accept Header**: `Accept: application/json;version=1`
3. **Custom Header**: `X-API-Version: 1`
4. **Query Parameter**: `?version=1`

#### Endpoints Structure

**Versioned Endpoints (v1):**

- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/restaurants/*` - Restaurant management
- `/api/v1/locations/*` - Location management
- `/api/v1/menu/*` - Menu management
- `/api/v1/orders/*` - Order management
- `/api/v1/docs` - API documentation
- `/api/v1/health` - Health check

**Legacy Endpoints (Backward Compatible):**

- `/api/auth/*` - Legacy authentication routes
- `/api/restaurants/*` - Legacy restaurant routes
- `/api/locations/*` - Legacy location routes
- `/api/menu/*` - Legacy menu routes
- `/api/orders/*` - Legacy order routes

#### Version Headers

All v1 responses include:

- `X-API-Version: 1` - Current API version
- `Link: </api/v1/docs>; rel="documentation"` - Documentation link

### 2. Rate Limiting

#### Rate Limiting Strategies

1. **General API**: 100 requests per 15 minutes
2. **Authentication**: 5 requests per 15 minutes (stricter)
3. **Restaurant Creation**: 3 requests per hour (very strict)
4. **Search**: 200 requests per 15 minutes (higher limit)
5. **File Upload**: 10 requests per hour
6. **Slow Down**: Gradual delay after 50 requests

#### Rate Limit Headers

All responses include standard rate limit headers:

- `RateLimit-Limit` - Maximum requests allowed
- `RateLimit-Remaining` - Remaining requests in window
- `RateLimit-Reset` - Time when the rate limit resets

#### Rate Limiting Application

**v1 API Routes:**

- General rate limiting applied to all v1 routes
- Specific rate limiting for sensitive operations:
  - Auth endpoints: Stricter limits
  - Restaurant creation: Very strict limits

**Legacy Routes:**

- Auth routes have stricter rate limiting
- Other legacy routes use general rate limiting

## 🔧 Technical Implementation

### Files Created/Modified

1. **`src/middleware/apiVersioningMiddleware.js`**
   - Version extraction from multiple sources
   - Version validation and error handling
   - Response transformation for compatibility
   - Documentation link injection

2. **`src/middleware/rateLimitMiddleware.js`**
   - Multiple rate limiting strategies
   - Comprehensive logging and monitoring
   - Flexible configuration options

3. **`src/routes/v1/index.js`**
   - Centralized v1 route handling
   - Rate limiting application per route type
   - API documentation endpoint

4. **`server.js`** (Updated)
   - Middleware integration in correct order
   - v1 route mounting
   - Legacy route compatibility
   - Main API documentation endpoint

### Middleware Order

The middleware is applied in the following order:

1. CORS and body parsing
2. XSS protection
3. **API Versioning** (extracts version, adds headers)
4. **Rate Limiting** (applies limits based on endpoint)
5. Logging
6. Route handlers

## 📊 Rate Limiting Configuration

| Endpoint Type       | Limit   | Window | Purpose                    |
| ------------------- | ------- | ------ | -------------------------- |
| General API         | 100 req | 15 min | Standard protection        |
| Authentication      | 5 req   | 15 min | Prevent brute force        |
| Restaurant Creation | 3 req   | 1 hour | Prevent spam               |
| Search              | 200 req | 15 min | Support high search volume |
| File Upload         | 10 req  | 1 hour | Control server resources   |

## 🔍 Usage Examples

### API Versioning

```bash
# Using URL path (recommended)
GET /api/v1/restaurants

# Using custom header
GET /api/restaurants
X-API-Version: 1

# Using Accept header
GET /api/restaurants
Accept: application/json;version=1

# Using query parameter
GET /api/restaurants?version=1
```

### Rate Limiting

```bash
# Check rate limit status
curl -I http://localhost:5000/api/v1/restaurants

# Response headers:
# RateLimit-Limit: 100
# RateLimit-Remaining: 99
# RateLimit-Reset: 1625097600
```

### API Documentation

```bash
# Main API information
GET /api

# v1 API documentation
GET /api/v1/docs

# v1 Health check
GET /api/v1/health
```

## 🧪 Testing

### Test Script

A comprehensive test script is available: `test-api-versioning.js`

```bash
# Install axios if not already installed
npm install axios

# Run the test script
node test-api-versioning.js
```

### Manual Testing

1. **Start the server:**

   ```bash
   npm start
   # or for development
   npm run dev
   ```

2. **Test API versioning:**

   ```bash
   curl http://localhost:5000/api/v1/health
   curl http://localhost:5000/api/v1/docs
   ```

3. **Test rate limiting:**
   ```bash
   # Make multiple rapid requests to see rate limiting in action
   for i in {1..10}; do curl -I http://localhost:5000/api/v1/restaurants; done
   ```

### Automated Tests

Run the complete test suite to verify functionality:

```bash
npm test
```

All 471 tests pass, confirming that the new features don't break existing functionality.

## 🔒 Security Features

### Rate Limiting Security

- **IP-based limiting**: Prevents abuse from individual IPs
- **Endpoint-specific limits**: Different limits for different risk levels
- **Logging**: All rate limit violations are logged
- **Gradual delays**: Slow down responses before hard limits

### Version Security

- **Input validation**: Version parameters are validated
- **Error handling**: Invalid versions return proper error responses
- **Sanitization**: All version inputs are sanitized

## 🚀 Future Enhancements

### Planned Features

1. **API v2**: When ready, add v2 support with deprecation warnings for v1
2. **User-based rate limiting**: Rate limits based on authenticated users
3. **Dynamic rate limiting**: Adjust limits based on server load
4. **Rate limiting storage**: Redis-based storage for distributed deployments

### Migration Path

- Legacy routes will continue to work
- New applications should use `/api/v1/*` endpoints
- When v2 is released, v1 will include deprecation warnings
- v1 will be supported for at least 12 months after v2 release

## 📝 Logging and Monitoring

### Rate Limiting Logs

- All rate limit violations are logged with IP, User-Agent, and endpoint
- Successful requests include rate limit status in debug logs

### Versioning Logs

- Version extraction is logged for debugging
- Invalid version requests are logged as warnings

### Log Levels

- `DEBUG`: Normal operation details
- `INFO`: Important operations (authentication, etc.)
- `WARN`: Rate limiting violations, invalid versions
- `ERROR`: System errors, database issues

---

## 📞 Support

For questions about the API versioning and rate limiting implementation:

1. Check the test suite for usage examples
2. Review the middleware source code for detailed implementation
3. Run the test script for live testing
4. Check application logs for debugging information
