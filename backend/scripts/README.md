# Database Setup Scripts

This directory contains scripts for setting up and managing the restaurant database system.

## Scripts

### 1. `create_databases_and_tables.js`

Creates the PostgreSQL databases and tables for the restaurant system.

**Usage:**

```bash
cd backend
node scripts/create_databases_and_tables.js
```

**What it does:**

- Creates three PostgreSQL databases:
  - `alacarte_prod` (production)
  - `alacarte_dev` (development)
  - `alacarte_test` (testing)
- Creates tables in each database:
  - `restaurants` - Main restaurant information
  - `restaurant_locations` - Location details (supports multi-location)
  - `billing_addresses` - Billing information
  - `payment_info` - Payment details (tokenized for security)
- Creates indexes for optimal performance
- Creates triggers for automatic `updated_at` timestamps

### 2. `seed_restaurants.js`

Seeds the databases with sample restaurant data for testing and development.

**Usage:**

```bash
cd backend
node scripts/seed_restaurants.js
```

**What it does:**

- Clears existing data from all tables
- Inserts 3 sample restaurants:
  1. **Pizzaria Bella** (single location, active)
  2. **Burger House** (multi-location chain, active)
  3. **Sabor Tropical** (single location, pending approval)
- Creates realistic test data including:
  - Restaurant details and owner information
  - Multiple locations with different operating hours
  - Billing addresses and payment information
  - Email confirmation tokens for pending restaurants

## Sample Login Credentials

After running the seed script, you can use these credentials for testing:

- **Email:** `joao@pizzariabella.com.br` | **Password:** `pizza123` (Active, Single Location)
- **Email:** `maria@burgerhouse.com.br` | **Password:** `burger456` (Active, Multi-location)
- **Email:** `carlos@sabortropical.com.br` | **Password:** `tropical789` (Pending Approval)

## Prerequisites

1. PostgreSQL server running locally or accessible via environment variables
2. Node.js dependencies installed (`npm install` in backend directory)
3. Environment variables configured (optional, defaults to localhost):
   - `DB_USER` (default: postgres)
   - `DB_HOST` (default: localhost)
   - `DB_PASSWORD` (default: password)
   - `DB_PORT` (default: 5432)

## Database Schema

The system supports:

- ✅ Single and multi-location restaurants
- ✅ Email confirmation workflow
- ✅ Secure password storage (bcrypt)
- ✅ Tokenized payment information
- ✅ Operating hours per location
- ✅ Feature selection per location
- ✅ Restaurant status management
- ✅ Audit trails with timestamps

## SQL Files

The SQL schema is organized in migration files under `src/db/migrations/`:

- `004_create_restaurants_table.sql`
- `005_create_restaurant_locations_table.sql`
- `006_create_billing_addresses_table.sql`
- `007_create_payment_info_table.sql`
- `008_create_timestamp_triggers.sql`

This separation allows for better version control and easier schema management.
