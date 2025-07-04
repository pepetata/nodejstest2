# Database Setup Scripts

⚠️ **MIGRATION NOTICE**: Most scripts in this directory have been deprecated in favor of the modern database management system in `src/db/`.

## Current Recommended Approach

The database management system is now separated into two distinct operations:

### 🔧 Database Setup Commands (Structure Only)

Create databases and run migrations without seed data:

```bash
# Setup all environments (structure only)
npm run db:setup

# Setup specific environment structure only
npm run db:setup:dev    # Development database structure
npm run db:setup:test   # Test database structure
npm run db:setup:prod   # Production database structure
```

### 🌱 Database Seed Commands (Data Only)

Insert sample data into existing databases:

```bash
# Seed specific environment data
npm run seed:dev        # Seeds alacarte_dev
npm run seed:test       # Seeds alacarte_test
npm run seed:prod       # Seeds alacarte_prod

# Legacy command (seeds default database)
npm run seed            # Seeds current environment
```

### 🚀 Complete Workflow Examples

```bash
# Development setup
npm run db:setup:dev    # Create structure
npm run seed:dev        # Add sample data

# Production deployment
npm run db:setup:prod   # Create structure only
# (Skip seeding in production or add real data)

# Testing setup
npm run db:setup:test   # Create structure
npm run seed:test       # Add test data

# Manual execution with options
node scripts/setup-database.js --help
```

## Modern Database Management

The new system provides **clear separation of concerns**:

### Setup Commands (--migrations-only)

- **Centralized Configuration**: Uses `src/config/db.js`
- **Database Creation**: Creates PostgreSQL databases for each environment
- **Schema Management**: Runs all migrations (tables, indexes, constraints, triggers)
- **Environment Aware**: Proper configuration for dev/test/prod
- **No Data**: Skips seed data insertion for clean production deployments

### Seed Commands (--seed-only)

- **Data Management**: Inserts sample/test data only
- **SQL-Based**: Seeds as SQL files for better maintainability and performance
- **Automatic Discovery**: Finds and runs all seed files in order
- **Environment Specific**: Targets specific databases (alacarte_dev, alacarte_test, alacarte_prod)
- **Idempotent**: Can be run multiple times safely

### Additional Benefits

- **Better Error Handling**: Comprehensive logging and error reporting
- **Integration**: Works seamlessly with the model layer
- **CI/CD Ready**: Clear separation perfect for deployment pipelines
- **Flexible**: Mix and match setup/seed as needed

### File Structure

```
src/
  db/
    migrations/          # SQL migration files
      001_create_users_table.sql
      002_create_menu_items_table.sql
      003_create_orders_tables.sql
      004_create_restaurants_table.sql
      005_create_restaurant_locations_table.sql
      006_create_billing_addresses_table.sql
      007_create_payment_info_table.sql
      008_create_timestamp_triggers.sql
    seeds/               # SQL seed data files
      003_restaurants.sql
      004_restaurant_locations.sql
    seedDatabase.js      # Modern migration/seed runner
```

## Current Scripts

### ✅ `setup-database.js` (ACTIVE - Use This)

**Modern unified database management script**

```bash
node scripts/setup-database.js [options]
```

**Command Line Options:**

- `--help, -h` - Show help message
- `--env <name>` - Target specific environment (development, test, production)
- `--migrations-only` - Create database and run migrations only (no seed data)
- `--seed-only` - Run seed data only (database must already exist)

**Examples:**

```bash
# Setup all environments (structure only)
node scripts/setup-database.js --migrations-only

# Setup development structure only
node scripts/setup-database.js --env development --migrations-only

# Seed development database only
node scripts/setup-database.js --env development --seed-only

# Full setup (structure + data) for development
node scripts/setup-database.js --env development
```

**Features:**

- Creates PostgreSQL databases for all environments
- Separation of migrations and seeding
- Environment-specific targeting
- Comprehensive error handling and logging
- CLI interface with help and validation

### ❌ `create_databases_and_tables.js` (DEPRECATED)

This script has been replaced by `setup-database.js`. The new script provides:

- Better error handling
- Automatic migration discovery
- Environment-specific setup
- Integration with the modern seed system

### ❌ `seed_restaurants.js` (DEPRECATED)

This script has been replaced by SQL seed files in `src/db/seeds/`. The new approach:

- Uses SQL for better performance and maintainability
- Integrates with the migration system
- Automatically discovered and executed
- Version controlled and trackable

## Migration Path

If you're currently using the old scripts:

1. **Stop using** `create_databases_and_tables.js` and `seed_restaurants.js`
2. **Start using separated commands**:
   - `npm run db:setup:dev` for database structure
   - `npm run seed:dev` for sample data
3. **Update deployment scripts**:
   - Replace `npm run db:setup` with `npm run db:setup:prod` (structure only)
   - Add `npm run seed:prod` only if you need sample data in production
4. **Refer to** `src/db/migrations/` and `src/db/seeds/` for schema and data

## Workflow Comparison

### Old Approach ❌

```bash
npm run db:setup:dev    # Created structure + added data (mixed concerns)
```

### New Approach ✅

```bash
npm run db:setup:dev    # Create structure only
npm run seed:dev        # Add data separately
```

### Production Benefits

```bash
# Production deployment (old way)
npm run db:setup:prod   # Would add sample data to production! 😱

# Production deployment (new way)
npm run db:setup:prod   # Structure only - safe for production! ✅
# npm run seed:prod     # Optional - only if you want sample data
```

## Database Schema

The modern system creates these tables:

### After Setup Commands (Structure Only)

- `users` - User accounts and authentication
- `menu_items` - Restaurant menu items
- `orders` - Customer orders and order items

### Restaurant Management (New)

- `restaurants` - Restaurant profiles and business info
- `restaurant_locations` - Multi-location support with operating hours
- `billing_addresses` - Billing information for restaurants
- `payment_info` - Payment method details (tokenized)

### After Seed Commands (Sample Data)

- **Admin user**: `admin@restaurant.com` / `admin123`
- **Test customer**: `customer@example.com` / `customer123`
- **Sample menu**: 15+ items (appetizers, mains, desserts, beverages)
- **3 sample restaurants**:
  - `joao@pizzariabella.com.br` / `pizza123` (single location, active)
  - `maria@burgerhouse.com.br` / `burger456` (multi-location, active)
  - `carlos@sabortropical.com.br` / `tropical789` (single location, pending)
- **5 restaurant locations** with realistic operating hours and features

### Technical Features

- **Security**: Parameterized queries, input validation, password hashing
- **Performance**: Proper indexes, foreign keys, triggers
- **Scalability**: Multi-location support, normalized data structure
- **Audit Trail**: Created/updated timestamps, automatic triggers
- **Scalability**: Multi-location support, normalized data structure
- **Audit Trail**: Created/updated timestamps, soft deletes where appropriate

## Quick Start

### For New Development:

```bash
# 1. Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# 2. Setup database structure
npm run db:setup:dev

# 3. Add sample data
npm run seed:dev

# 4. Start development
npm run dev
```

### For Production Deployment:

```bash
# 1. Setup database structure only
npm run db:setup:prod

# 2. Add production data (optional)
# npm run seed:prod  # Only if you want sample data

# 3. Deploy application
npm start
```

### For Testing:

```bash
# 1. Setup test database structure
npm run db:setup:test

# 2. Add test data
npm run seed:test

# 3. Run tests
npm test
```

### For Existing Projects:

```bash
# 1. Migrate to new separated system
npm run db:setup:dev  # Setup development database structure

# 2. Add sample data
npm run seed:dev

# 3. Verify everything works
# Check that your application connects and data is correct

# 4. Update deployment scripts
# Replace old combined commands with separated setup/seed commands
```

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

## Prerequisites

1. **PostgreSQL server** running locally or accessible via environment variables
2. **Node.js dependencies** installed (`npm install` in backend directory)
3. **Environment variables** configured (optional, defaults to localhost):
   - `DB_USER` (default: postgres)
   - `DB_HOST` (default: localhost)
   - `DB_PASSWORD` (default: password)
   - `DB_PORT` (default: 5432)

## Database Environments

The system manages three separate databases:

- **`alacarte_dev`** - Development database (npm run db:setup:dev / seed:dev)
- **`alacarte_test`** - Testing database (npm run db:setup:test / seed:test)
- **`alacarte_prod`** - Production database (npm run db:setup:prod / seed:prod)

## System Capabilities

The system supports:

- ✅ **Separated Operations**: Structure setup vs. data seeding
- ✅ **Environment Isolation**: Dev/test/prod database separation
- ✅ **Single and multi-location restaurants**
- ✅ **Email confirmation workflow**
- ✅ **Secure password storage** (bcrypt)
- ✅ **Tokenized payment information**
- ✅ **Operating hours per location**
- ✅ **Feature selection per location**
- ✅ **Restaurant status management**
- ✅ **Audit trails with timestamps**

## File Organization

### Migration Files (`src/db/migrations/`)

Schema definitions executed during setup commands:

- `001_create_users_table.sql`
- `002_create_menu_items_table.sql`
- `003_create_orders_tables.sql`
- `004_create_restaurants_table.sql`
- `005_create_restaurant_locations_table.sql`
- `006_create_billing_addresses_table.sql`
- `007_create_payment_info_table.sql`
- `008_create_timestamp_triggers.sql`

### Seed Files (`src/db/seeds/`)

Sample data inserted during seed commands:

- `001_users.sql` - Admin and test users
- `002_menu_items.sql` - Sample menu items
- `003_restaurants.sql` - 3 sample restaurants
- `004_restaurant_locations.sql` - 5 restaurant locations

This separation allows for better version control, easier schema management, and flexible deployment strategies.
