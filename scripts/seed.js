#!/usr/bin/env node

/**
 * Database seeding script
 * Populates the database with initial data for development and testing
 */

import pg from 'pg';
import { loadConfig } from '../src/infrastructure/config/config.js';

const { Client } = pg;

async function seed() {
  let client;
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Load configuration
    const config = await loadConfig();
    
    if (!config.database.enabled) {
      console.log('❌ Database is disabled in configuration');
      process.exit(1);
    }

    // Create database client
    client = new Client({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl
    });

    await client.connect();
    console.log('✅ Connected to database');

    // Clear existing data (in development only)
    if (config.environment === 'development') {
      console.log('🧹 Clearing existing data...');
      await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    }

    // Seed users
    console.log('👥 Seeding users...');
    const users = [
      {
        email: 'admin@example.com',
        name: 'System Administrator'
      },
      {
        email: 'john.doe@example.com',
        name: 'John Doe'
      },
      {
        email: 'jane.smith@example.com',
        name: 'Jane Smith'
      },
      {
        email: 'developer@example.com',
        name: 'Developer User'
      },
      {
        email: 'tester@example.com',
        name: 'Test User'
      }
    ];

    for (const user of users) {
      try {
        await client.query(
          'INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
          [user.email, user.name]
        );
        console.log(`   ✓ Added user: ${user.email}`);
      } catch (error) {
        console.log(`   ❌ Failed to add user ${user.email}:`, error.message);
      }
    }

    // Verify seeded data
    const result = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    console.log(`✅ Database seeding completed`);
    console.log(`📊 Total users in database: ${userCount}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const forceFlag = args.includes('--force');

if (process.env.NODE_ENV === 'production' && !forceFlag) {
  console.log('❌ Cannot seed production database without --force flag');
  console.log('Usage: npm run db:seed -- --force');
  process.exit(1);
}

// Run seeding
seed();