/* eslint-disable no-console */

/**
 * ⚠️  DEPRECATED SCRIPT ⚠️
 *
 * This script has been replaced by the modern SQL-based seeding system.
 *
 * The new approach provides:
 * - SQL seed files for better data management
 * - Automatic seed discovery and execution
 * - Better performance and maintainability
 * - Integration with migration system
 * - Centralized configuration
 *
 * Restaurant seed data is now located in:
 *   src/db/seeds/003_restaurants.sql
 *   src/db/seeds/004_restaurant_locations.sql
 *
 * To seed the database, use:
 *   npm run seed                    # Seed current environment
 *   npm run db:setup               # Full database setup (creates + seeds)
 *   node scripts/setup-database.js # Full setup with options
 *
 * This file will be removed in a future version.
 */

console.log('⚠️  WARNING: This script is deprecated!');
console.log('Restaurant seeding is now handled by SQL files in src/db/seeds/');
console.log('');
console.log('Please use one of these instead:');
console.log('  npm run seed          # Seed current environment');
console.log('  npm run db:setup      # Full database setup');
console.log('');
console.log('Seed files location: src/db/seeds/003_restaurants.sql');
console.log('');

// Legacy functionality preserved for compatibility
const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import database environments
const { environments } = require('./create_databases_and_tables');

// Function to hash passwords
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Generate email confirmation token
function generateConfirmationToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Sample restaurant data
const sampleRestaurants = [
  {
    // Single location restaurant
    restaurant: {
      owner_name: 'João Silva',
      email: 'joao@pizzariabella.com.br',
      password: 'pizza123',
      phone: '11987654321',
      whatsapp: '11987654321',
      restaurant_name: 'Pizzaria Bella',
      restaurant_url_name: 'pizzaria-bella',
      business_type: 'single',
      cuisine_type: 'Italiana',
      website: 'https://pizzariabella.com.br',
      description:
        'A melhor pizzaria italiana da região, com massa artesanal e ingredientes frescos.',
      subscription_plan: 'premium',
      marketing_consent: true,
      terms_accepted: true,
      status: 'active',
    },
    locations: [
      {
        name: 'Pizzaria Bella - Matriz',
        url_name: 'matriz',
        phone: '11987654321',
        whatsapp: '11987654321',
        address_zip_code: '01310-100',
        address_street: 'Avenida Paulista',
        address_street_number: '1578',
        address_complement: 'Loja 2',
        address_city: 'São Paulo',
        address_state: 'SP',
        operating_hours: {
          monday: { open: '18:00', close: '23:00', closed: false },
          tuesday: { open: '18:00', close: '23:00', closed: false },
          wednesday: { open: '18:00', close: '23:00', closed: false },
          thursday: { open: '18:00', close: '23:00', closed: false },
          friday: { open: '18:00', close: '00:00', closed: false },
          saturday: { open: '18:00', close: '00:00', closed: false },
          sunday: { open: '18:00', close: '23:00', closed: false },
          holidays: { open: '19:00', close: '22:00', closed: false },
        },
        selected_features: ['digital_menu', 'online_ordering', 'delivery_tracking'],
        is_primary: true,
      },
    ],
    billing_address: {
      zip_code: '01310-100',
      street: 'Avenida Paulista',
      street_number: '1578',
      complement: 'Loja 2',
      city: 'São Paulo',
      state: 'SP',
      same_as_restaurant: true,
    },
  },
  {
    // Multi-location restaurant chain
    restaurant: {
      owner_name: 'Maria Santos',
      email: 'maria@burgerhouse.com.br',
      password: 'burger456',
      phone: '11876543210',
      whatsapp: '11876543210',
      restaurant_name: 'Burger House',
      restaurant_url_name: 'burger-house',
      business_type: 'multi-location',
      cuisine_type: 'Americana',
      website: 'https://burgerhouse.com.br',
      description:
        'Rede de hamburguerias artesanais com ingredientes selecionados e carnes premium.',
      subscription_plan: 'enterprise',
      marketing_consent: true,
      terms_accepted: true,
      status: 'active',
    },
    locations: [
      {
        name: 'Burger House - Shopping Center Norte',
        url_name: 'center-norte',
        phone: '11876543210',
        whatsapp: '11876543210',
        address_zip_code: '02071-000',
        address_street: 'Travessa Casalbuono',
        address_street_number: '120',
        address_complement: 'Loja 245 - Piso L2',
        address_city: 'São Paulo',
        address_state: 'SP',
        operating_hours: {
          monday: { open: '10:00', close: '22:00', closed: false },
          tuesday: { open: '10:00', close: '22:00', closed: false },
          wednesday: { open: '10:00', close: '22:00', closed: false },
          thursday: { open: '10:00', close: '22:00', closed: false },
          friday: { open: '10:00', close: '23:00', closed: false },
          saturday: { open: '10:00', close: '23:00', closed: false },
          sunday: { open: '12:00', close: '22:00', closed: false },
          holidays: { open: '12:00', close: '20:00', closed: false },
        },
        selected_features: [
          'digital_menu',
          'online_ordering',
          'delivery_tracking',
          'table_booking',
        ],
        is_primary: true,
      },
      {
        name: 'Burger House - Vila Madalena',
        url_name: 'vila-madalena',
        phone: '11876543211',
        whatsapp: '11876543211',
        address_zip_code: '05414-002',
        address_street: 'Rua Aspicuelta',
        address_street_number: '332',
        address_complement: '',
        address_city: 'São Paulo',
        address_state: 'SP',
        operating_hours: {
          monday: { open: '17:00', close: '01:00', closed: false },
          tuesday: { open: '17:00', close: '01:00', closed: false },
          wednesday: { open: '17:00', close: '01:00', closed: false },
          thursday: { open: '17:00', close: '02:00', closed: false },
          friday: { open: '17:00', close: '03:00', closed: false },
          saturday: { open: '12:00', close: '03:00', closed: false },
          sunday: { open: '12:00', close: '01:00', closed: false },
          holidays: { open: '17:00', close: '23:00', closed: false },
        },
        selected_features: ['digital_menu', 'online_ordering', 'live_music', 'happy_hour'],
        is_primary: false,
      },
      {
        name: 'Burger House - Alphaville',
        url_name: 'alphaville',
        phone: '11876543212',
        whatsapp: '11876543212',
        address_zip_code: '06454-070',
        address_street: 'Alameda Rio Negro',
        address_street_number: '111',
        address_complement: 'Loja 15',
        address_city: 'Barueri',
        address_state: 'SP',
        operating_hours: {
          monday: { open: '11:00', close: '23:00', closed: false },
          tuesday: { open: '11:00', close: '23:00', closed: false },
          wednesday: { open: '11:00', close: '23:00', closed: false },
          thursday: { open: '11:00', close: '23:00', closed: false },
          friday: { open: '11:00', close: '00:00', closed: false },
          saturday: { open: '11:00', close: '00:00', closed: false },
          sunday: { open: '11:00', close: '23:00', closed: false },
          holidays: { open: '12:00', close: '22:00', closed: false },
        },
        selected_features: ['digital_menu', 'online_ordering', 'delivery_tracking', 'drive_thru'],
        is_primary: false,
      },
    ],
    billing_address: {
      zip_code: '02071-000',
      street: 'Travessa Casalbuono',
      street_number: '120',
      complement: 'Administração',
      city: 'São Paulo',
      state: 'SP',
      same_as_restaurant: false,
    },
  },
  {
    // Pending approval restaurant
    restaurant: {
      owner_name: 'Carlos Oliveira',
      email: 'carlos@sabortropical.com.br',
      password: 'tropical789',
      phone: '11765432109',
      whatsapp: '11765432109',
      restaurant_name: 'Sabor Tropical',
      restaurant_url_name: 'sabor-tropical',
      business_type: 'single',
      cuisine_type: 'Brasileira',
      website: 'https://sabortropical.com.br',
      description:
        'Restaurante especializado em culinária nordestina com pratos típicos e ambiente acolhedor.',
      subscription_plan: 'starter',
      marketing_consent: false,
      terms_accepted: true,
      status: 'pending',
    },
    locations: [
      {
        name: 'Sabor Tropical',
        url_name: 'principal',
        phone: '11765432109',
        whatsapp: '11765432109',
        address_zip_code: '03310-000',
        address_street: 'Rua da Mooca',
        address_street_number: '2560',
        address_complement: '',
        address_city: 'São Paulo',
        address_state: 'SP',
        operating_hours: {
          monday: { open: '11:00', close: '15:00', closed: false },
          tuesday: { open: '11:00', close: '15:00', closed: false },
          wednesday: { open: '11:00', close: '15:00', closed: false },
          thursday: { open: '11:00', close: '15:00', closed: false },
          friday: { open: '11:00', close: '15:00', closed: false },
          saturday: { open: '11:00', close: '16:00', closed: false },
          sunday: { open: '00:00', close: '00:00', closed: true },
          holidays: { open: '00:00', close: '00:00', closed: true },
        },
        selected_features: ['digital_menu'],
        is_primary: true,
      },
    ],
    billing_address: {
      zip_code: '03310-000',
      street: 'Rua da Mooca',
      street_number: '2560',
      complement: '',
      city: 'São Paulo',
      state: 'SP',
      same_as_restaurant: true,
    },
  },
];

// Function to seed a specific database
async function seedDatabase(dbName) {
  const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    database: dbName,
  };

  const client = new Client(config);

  try {
    await client.connect();
    console.log(`🌱 Starting to seed database: ${dbName}`);

    // Clear existing data (in reverse order due to foreign keys)
    await client.query('DELETE FROM payment_info');
    await client.query('DELETE FROM billing_addresses');
    await client.query('DELETE FROM restaurant_locations');
    await client.query('DELETE FROM restaurants');

    // Reset sequences
    await client.query('ALTER SEQUENCE restaurants_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE restaurant_locations_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE billing_addresses_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE payment_info_id_seq RESTART WITH 1');

    console.log('  🗑️  Cleared existing data');

    // Insert sample restaurants
    for (const restaurantData of sampleRestaurants) {
      const { restaurant, locations, billing_address } = restaurantData;

      // Hash the password
      const hashedPassword = await hashPassword(restaurant.password);

      // Generate email confirmation token
      const confirmationToken = generateConfirmationToken();
      const confirmationExpires = new Date();
      confirmationExpires.setHours(confirmationExpires.getHours() + 24); // 24 hours from now

      // Insert restaurant
      const restaurantResult = await client.query(
        `INSERT INTO restaurants (
          owner_name, email, email_confirmed, email_confirmation_token,
          email_confirmation_expires, password, phone, whatsapp,
          restaurant_name, restaurant_url_name, business_type, cuisine_type,
          website, description, subscription_plan, marketing_consent,
          terms_accepted, terms_accepted_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id`,
        [
          restaurant.owner_name,
          restaurant.email,
          restaurant.status === 'active', // Email confirmed for active restaurants
          restaurant.status === 'pending' ? confirmationToken : null,
          restaurant.status === 'pending' ? confirmationExpires : null,
          hashedPassword,
          restaurant.phone,
          restaurant.whatsapp,
          restaurant.restaurant_name,
          restaurant.restaurant_url_name,
          restaurant.business_type,
          restaurant.cuisine_type,
          restaurant.website,
          restaurant.description,
          restaurant.subscription_plan,
          restaurant.marketing_consent,
          restaurant.terms_accepted,
          restaurant.terms_accepted ? new Date() : null,
          restaurant.status,
        ]
      );

      const restaurantId = restaurantResult.rows[0].id;
      console.log(
        `  ✅ Restaurant "${restaurant.restaurant_name}" created with ID: ${restaurantId}`
      );

      // Insert locations
      for (const location of locations) {
        await client.query(
          `INSERT INTO restaurant_locations (
            restaurant_id, name, url_name, phone, whatsapp,
            address_zip_code, address_street, address_street_number,
            address_complement, address_city, address_state,
            operating_hours, selected_features, is_primary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            restaurantId,
            location.name,
            location.url_name,
            location.phone,
            location.whatsapp,
            location.address_zip_code,
            location.address_street,
            location.address_street_number,
            location.address_complement,
            location.address_city,
            location.address_state,
            JSON.stringify(location.operating_hours),
            location.selected_features,
            location.is_primary,
          ]
        );
        console.log(`    📍 Location "${location.name}" added`);
      }

      // Insert billing address
      await client.query(
        `INSERT INTO billing_addresses (
          restaurant_id, zip_code, street, street_number, complement,
          city, state, same_as_restaurant
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          restaurantId,
          billing_address.zip_code,
          billing_address.street,
          billing_address.street_number,
          billing_address.complement,
          billing_address.city,
          billing_address.state,
          billing_address.same_as_restaurant,
        ]
      );
      console.log(`    💳 Billing address added`);

      // Insert dummy payment info for active restaurants
      if (restaurant.status === 'active') {
        await client.query(
          `INSERT INTO payment_info (
            restaurant_id, card_token, cardholder_name, last_four_digits,
            card_type, expiry_month, expiry_year, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            restaurantId,
            `token_${restaurantId}_${Date.now()}`, // Dummy token
            restaurant.owner_name,
            '1234', // Last 4 digits
            'Visa',
            12,
            2025,
            true,
          ]
        );
        console.log(`    💳 Payment info added`);
      }

      console.log();
    }

    // Display summary
    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM restaurants) as restaurants,
        (SELECT COUNT(*) FROM restaurant_locations) as locations,
        (SELECT COUNT(*) FROM billing_addresses) as billing_addresses,
        (SELECT COUNT(*) FROM payment_info) as payment_info
    `);

    const summary = counts.rows[0];
    console.log(`📊 Database ${dbName} seeding completed!`);
    console.log(`   - ${summary.restaurants} restaurants`);
    console.log(`   - ${summary.locations} locations`);
    console.log(`   - ${summary.billing_addresses} billing addresses`);
    console.log(`   - ${summary.payment_info} payment records`);
    console.log();
  } catch (error) {
    console.error(`❌ Error seeding database ${dbName}:`, error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Function to seed all databases
async function seedAllDatabases() {
  console.log('🌱 Starting restaurant database seeding...\n');

  try {
    for (const [env, dbName] of Object.entries(environments)) {
      console.log(`Seeding ${env} database: ${dbName}`);
      await seedDatabase(dbName);
    }

    console.log('🎉 All databases seeded successfully!\n');
    console.log('Sample restaurants created:');
    sampleRestaurants.forEach((restaurant, index) => {
      console.log(
        `${index + 1}. ${restaurant.restaurant.restaurant_name} (${restaurant.restaurant.business_type})`
      );
      console.log(`   Email: ${restaurant.restaurant.email}`);
      console.log(`   Password: ${restaurant.restaurant.password}`);
      console.log(`   Status: ${restaurant.restaurant.status}`);
      console.log(`   Locations: ${restaurant.locations.length}`);
      console.log();
    });

    console.log('🔐 Login credentials for testing:');
    console.log('Email: joao@pizzariabella.com.br | Password: pizza123 (Active)');
    console.log('Email: maria@burgerhouse.com.br | Password: burger456 (Active, Multi-location)');
    console.log('Email: carlos@sabortropical.com.br | Password: tropical789 (Pending approval)');
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedAllDatabases();
}

module.exports = {
  seedAllDatabases,
  seedDatabase,
  sampleRestaurants,
};
