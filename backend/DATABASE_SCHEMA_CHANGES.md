# Database Schema Changes - User Management System

## Overview

Major restructuring of the database schema to properly separate restaurant business information from user management, implementing a comprehensive multi-role user system for restaurant operations.

## Problem Addressed

Previously, user-related fields were incorrectly placed in the `restaurants` table. This has been corrected to follow proper database normalization and support the complex user role hierarchy required for restaurant management.

## User Roles Implemented

### 1. Restaurant Administrator

- **Highest level access** - Restaurant owner or top manager
- **Requirements**: Email address (required), restaurant_id (required)
- **Authentication**: Email-based login
- **Capabilities**:
  - Manage all locations under restaurant account
  - Create Location Administrators, Waiters, Food Runners, KDS Operators, POS Operators
  - Access subscription and billing information
- **Email Confirmation**: Required upon account creation

### 2. Location Administrator

- **Location-specific management** role
- **Requirements**: Email address (required)
- **Authentication**: Email-based login
- **Capabilities**:
  - Manage assigned locations only
  - Create Waiters, Food Runners, KDS Operators, POS Operators within assigned locations
  - Cannot access restaurant-level subscription details
- **Email Confirmation**: Required upon account creation
- **First Login**: Must change password on first login

### 3. Waiter

- **Order taking and table management** role
- **Requirements**: Username/ID (email optional)
- **Authentication**: Username/ID and password
- **Capabilities**:
  - Order taking, table management, customer service
  - Location-specific access only
  - Can be assigned to multiple locations
- **Account Creation**: Confirmed by administrator upon creation
- **First Login**: Must change password on first login

### 4. Food Runner

- **Food delivery** role (kitchen to tables)
- **Requirements**: Username/ID (email optional)
- **Authentication**: Username/ID and password
- **Capabilities**:
  - Deliver food from kitchen to tables
  - Location-specific access only
  - Can be assigned to multiple locations
- **Account Creation**: Confirmed by administrator upon creation
- **First Login**: Must change password on first login

### 5. KDS Operator (Kitchen Display System)

- **Kitchen operations** role
- **Requirements**: Username/ID (email optional)
- **Authentication**: Username/ID and password
- **Capabilities**:
  - Interact with Kitchen Display System
  - View and manage food preparation workflow
  - Access specific KDS stations (e.g., "Grill KDS", "Sauté KDS")
  - Location and station-specific access
- **Account Creation**: Confirmed by administrator upon creation
- **First Login**: Must change password on first login

### 6. POS Operator (Point-of-Sale)

- **Transaction processing** role
- **Requirements**: Username/ID (email optional)
- **Authentication**: Username/ID and password
- **Capabilities**:
  - Handle transactions and payments
  - Basic order management at POS terminals
  - Location-specific access only
- **Account Creation**: Confirmed by administrator upon creation
- **First Login**: Must change password on first login

## Database Schema Changes

### Modified Tables

#### 1. `users` Table (Enhanced)

```sql
-- Key changes to users table:
- Changed id from SERIAL to UUID
- Added username field for non-email roles
- Made email optional (required only for admin roles)
- Added role enum with all 6 user types
- Added restaurant_id for restaurant administrators
- Added comprehensive status management
- Added email confirmation system
- Added first login password change requirement
- Added audit fields (created_by, last_login_at, etc.)
```

**New Fields:**

- `username` - For roles that don't require email
- `restaurant_id` - Links restaurant administrators to their restaurant
- `status` - Account status (pending, active, inactive, suspended)
- `email_confirmed` - Email confirmation status
- `email_confirmation_token` - Email verification token
- `email_confirmation_expires` - Token expiration
- `first_login_password_change` - Forces password change on first login
- `password_changed_at` - Password change tracking
- `password_reset_token` - Password reset functionality
- `password_reset_expires` - Reset token expiration
- `created_by` - Audit trail of who created the user
- `last_login_at` - Login tracking

#### 2. `restaurants` Table (Cleaned)

```sql
-- Separated business information from user management
- Removed all user-related fields
- Focused on restaurant business information
- Added subscription management
- Added business compliance fields
```

**Business-focused Fields:**

- `restaurant_name` - Business name
- `restaurant_url_name` - URL-friendly identifier
- `business_type` - single, chain, franchise
- `cuisine_type` - Type of cuisine
- `subscription_plan` - Service tier
- `subscription_status` - Billing status
- `terms_accepted` - Legal compliance
- `marketing_consent` - Communication preferences

### New Tables

#### 3. `user_location_assignments` Table (New)

```sql
-- Manages user access to specific restaurant locations
- Links users to locations they can access
- Supports multiple location assignments
- Includes KDS station-specific assignments
- Tracks assignment audit trail
```

**Key Features:**

- `user_id` - User being assigned
- `location_id` - Location being accessed
- `is_primary_location` - User's main working location
- `assigned_by` - Who made the assignment
- `kds_stations` - Array of KDS stations for KDS operators

## Business Logic Constraints

### Role-Based Constraints

1. **Restaurant Administrators** must have both `restaurant_id` and `email`
2. **Location Administrators** must have `email`
3. **All users** must have either `email` or `username`
4. **Only one primary location** per user is allowed

### Security Features

1. **Email confirmation** required for admin roles
2. **First login password change** required for all non-restaurant-administrator roles
3. **Password reset** functionality with token expiration
4. **Account status** management for access control

### Multi-Location Support

1. **Users can be assigned to multiple locations**
2. **Primary location** designation for default context
3. **KDS operators** can be assigned to specific stations
4. **Location isolation** ensures users only access assigned locations

## Migration Order

1. `001_create_users_table.sql` - Enhanced user management
2. `004_create_restaurants_table.sql` - Clean business information
3. `009_create_user_location_assignments_table.sql` - Location access management
4. `010_add_users_foreign_keys.sql` - Relationships and constraints

## Impact on Application

- **Authentication system** needs to support both email and username login
- **Role-based access control** implementation required
- **Location context** management for multi-location users
- **User creation workflows** need to follow role hierarchy
- **Password management** with first-login change requirements

## Next Steps

1. Update application models to reflect new schema
2. Implement role-based authentication middleware
3. Create user management interfaces for administrators
4. Update seed data to reflect new structure
5. Create migration path for existing data
