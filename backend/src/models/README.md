# Restaurant Models Documentation

This document describes the secure model architecture for the restaurant management system, following modern best practices for security, validation, and data integrity.

## Architecture Overview

### Security Features Implemented

1. **SQL Injection Prevention**
   - All queries use parameterized statements
   - Dynamic query building with safe parameter binding
   - Input validation before database operations

2. **Input Validation & Sanitization**
   - Joi schema validation for all inputs
   - Data type enforcement and conversion
   - Length and format restrictions
   - Automatic data trimming and cleaning

3. **Data Protection**
   - Sensitive field masking (passwords, tokens)
   - Password hashing with bcrypt (12 salt rounds)
   - Payment data tokenization (PCI compliance considerations)
   - Email confirmation token generation

4. **Error Handling**
   - Sanitized error responses (no data exposure)
   - Specific error codes for different scenarios
   - Comprehensive logging without sensitive data

5. **Transaction Support**
   - ACID compliance for complex operations
   - Automatic rollback on failures
   - Connection pooling with proper cleanup

## Models

### BaseModel

**Purpose:** Abstract base class providing common functionality for all models.

**Key Features:**

- Parameterized query building
- Input validation with Joi
- Transaction management
- Error handling and sanitization
- Generic CRUD operations

**Methods:**

- `validate(data, schema)` - Joi validation
- `buildWhereClause(conditions)` - Safe WHERE clause building
- `buildSetClause(data)` - Safe SET clause building
- `executeQuery(text, params)` - Query execution with error handling
- `find(conditions, options, columns)` - Generic find operations
- `beginTransaction()` - Transaction management

### RestaurantModel

**Purpose:** Handles restaurant registration, authentication, and management.

**Security Features:**

- Password hashing with bcrypt (12 salt rounds)
- Email confirmation workflow
- Input validation and sanitization
- Authentication with secure password verification

**Key Methods:**

```javascript
// Create restaurant with validation and security
await RestaurantModel.create({
  owner_name: 'João Silva',
  email: 'joao@restaurant.com',
  password: 'securePassword123',
  restaurant_name: 'My Restaurant',
  // ... other fields
});

// Secure authentication
const restaurant = await RestaurantModel.authenticate(email, password);

// Email confirmation
const confirmed = await RestaurantModel.confirmEmail(token);

// Update with validation
await RestaurantModel.update(id, updateData);
```

**Validation Rules:**

- Email: Valid email format, lowercase, max 255 chars
- Password: Min 8 chars, max 128 chars
- Restaurant URL name: Lowercase, alphanumeric + hyphens only
- Phone/WhatsApp: 10-15 digits only
- Terms acceptance: Required (true)

### RestaurantLocationModel

**Purpose:** Manages restaurant locations for multi-location support.

**Key Features:**

- Operating hours validation (24-hour format)
- Primary location management
- Address validation
- Feature selection per location
- URL name uniqueness per restaurant

**Key Methods:**

```javascript
// Create location with validation
await RestaurantLocationModel.create({
  restaurant_id: 1,
  name: 'Main Location',
  url_name: 'main',
  operating_hours: {
    monday: { open: '09:00', close: '22:00', closed: false },
    // ... other days
  },
  selected_features: ['digital_menu', 'online_ordering'],
});

// Get restaurant locations
const locations = await RestaurantLocationModel.getByRestaurantId(restaurantId);

// Set primary location (atomic operation)
await RestaurantLocationModel.setPrimary(locationId);
```

**Validation Rules:**

- Operating hours: HH:MM format validation
- URL name: Unique per restaurant, alphanumeric + hyphens
- Features: Array of valid feature strings
- Address fields: Length and format validation

### BillingAddressModel

**Purpose:** Handles billing address information for restaurants.

**Key Features:**

- Brazilian ZIP code (CEP) validation
- Address formatting and validation
- Copy from primary location functionality
- One billing address per restaurant

**Key Methods:**

```javascript
// Create or update billing address
await BillingAddressModel.createOrUpdate({
  restaurant_id: 1,
  zip_code: '01310-100',
  street: 'Avenida Paulista',
  street_number: '1000',
  city: 'São Paulo',
  state: 'SP',
});

// Get formatted address string
const formatted = await BillingAddressModel.getFormattedAddress(restaurantId);

// Copy from primary location
await BillingAddressModel.copyFromPrimaryLocation(restaurantId);
```

### PaymentInfoModel

**Purpose:** Secure payment information management with tokenization.

**⚠️ Security Warning:** This is a simplified implementation. In production, use payment processors like Stripe, PayPal, or similar services for PCI compliance.

**Security Features:**

- Card number validation (Luhn algorithm)
- Tokenization (simulated - use real payment processor in production)
- Only last 4 digits stored
- CVV never stored
- Expiry date validation
- Card type detection

**Key Methods:**

```javascript
// Add payment method (tokenized)
await PaymentInfoModel.createOrUpdate({
  restaurant_id: 1,
  card_number: '4111111111111111', // Tokenized, never stored
  cardholder_name: 'João Silva',
  expiry_month: 12,
  expiry_year: 2025,
  cvv: '123', // Validated, never stored
});

// Get active payment info (sanitized)
const payment = await PaymentInfoModel.getActiveByRestaurantId(restaurantId);

// Check expiring cards
const expiring = await PaymentInfoModel.getCardsExpiringSoon(restaurantId);
```

**Validation Rules:**

- Card number: Luhn algorithm validation, 13-19 digits
- Expiry date: Future date validation, max 10 years
- CVV: 3-4 digits
- Cardholder name: 2-255 characters

## Usage Examples

### Complete Restaurant Registration Flow

```javascript
const { RestaurantModel, RestaurantLocationModel, BillingAddressModel } = require('./models');

async function registerRestaurant(registrationData) {
  const client = await RestaurantModel.beginTransaction();

  try {
    // 1. Create restaurant
    const restaurant = await RestaurantModel.create({
      owner_name: registrationData.owner_name,
      email: registrationData.email,
      password: registrationData.password,
      restaurant_name: registrationData.restaurant_name,
      restaurant_url_name: registrationData.restaurant_url_name,
      // ... other fields
    });

    // 2. Create primary location
    const location = await RestaurantLocationModel.create({
      restaurant_id: restaurant.id,
      name: 'Main Location',
      url_name: 'main',
      is_primary: true,
      operating_hours: registrationData.operating_hours,
      // ... address fields
    });

    // 3. Create billing address
    await BillingAddressModel.createOrUpdate({
      restaurant_id: restaurant.id,
      same_as_restaurant: true,
      // ... address fields
    });

    await RestaurantModel.commitTransaction(client);
    return restaurant;
  } catch (error) {
    await RestaurantModel.rollbackTransaction(client);
    throw error;
  }
}
```

### Secure Authentication

```javascript
async function authenticateRestaurant(email, password) {
  try {
    // Authenticate with automatic password verification
    const restaurant = await RestaurantModel.authenticate(email, password);

    if (!restaurant) {
      throw new Error('Invalid credentials');
    }

    if (!restaurant.email_confirmed) {
      throw new Error('Email not confirmed');
    }

    if (restaurant.status !== 'active') {
      throw new Error('Account not active');
    }

    return restaurant; // Sanitized data (no password/tokens)
  } catch (error) {
    // Log security event
    console.log('Authentication attempt failed', { email, error: error.message });
    throw error;
  }
}
```

### Multi-Location Management

```javascript
async function addLocation(restaurantId, locationData) {
  try {
    // Validate restaurant ownership
    const restaurant = await RestaurantModel.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Create new location
    const location = await RestaurantLocationModel.create({
      restaurant_id: restaurantId,
      ...locationData,
    });

    return location;
  } catch (error) {
    if (error.message.includes('already exists')) {
      throw new Error('Location URL name already exists');
    }
    throw error;
  }
}
```

## Security Considerations

### Input Validation

- All inputs validated with Joi schemas
- SQL injection prevention through parameterized queries
- Data type enforcement and sanitization
- Length and format restrictions

### Authentication & Authorization

- Passwords hashed with bcrypt (12 salt rounds)
- Email confirmation required for activation
- Secure token generation for confirmations
- Session management (implement JWT or similar)

### Data Protection

- Sensitive fields automatically masked in outputs
- Payment data tokenization (use real processor in production)
- Audit trails with timestamps
- Connection pooling with proper cleanup

### Error Handling

- Sanitized error messages (no data exposure)
- Comprehensive logging without sensitive data
- Specific error codes for different scenarios
- Graceful degradation

### Database Security

- Connection pooling with timeouts
- Transaction support for data integrity
- Foreign key constraints
- Indexed queries for performance

## Best Practices Implemented

1. **Separation of Concerns:** Each model handles specific domain logic
2. **DRY Principle:** Common functionality in BaseModel
3. **Input Validation:** Comprehensive Joi schemas
4. **Error Handling:** Consistent error patterns
5. **Security:** Multiple layers of protection
6. **Performance:** Optimized queries and indexing
7. **Maintainability:** Well-documented and modular code
8. **Testing:** Designed for easy unit testing

## Production Considerations

1. **Payment Processing:** Integrate with Stripe, PayPal, or similar
2. **Logging:** Implement structured logging (Winston, Bunyan)
3. **Monitoring:** Add performance and error monitoring
4. **Rate Limiting:** Implement API rate limiting
5. **Caching:** Add Redis for frequently accessed data
6. **Encryption:** Encrypt sensitive data at rest
7. **Backup:** Implement regular database backups
8. **Testing:** Comprehensive unit and integration tests
