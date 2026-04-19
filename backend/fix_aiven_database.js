// Auto-fix script for Aiven database setup
// This will create missing tables and columns for the demo feature

require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fixDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT || 3306,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    console.log('✅ Connected to Aiven database successfully!\n');

    // Check and create demo tables
    console.log('🔧 Checking and creating demo tables...\n');

    // Create demo_sessions table
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS demo_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255),
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          data_deleted BOOLEAN DEFAULT FALSE
        )
      `);
      console.log('✅ demo_sessions table created/verified');
    } catch (error) {
      console.log('❌ Failed to create demo_sessions table:', error.message);
    }

    // Create demo_data_tracking table
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS demo_data_tracking (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          table_name VARCHAR(100) NOT NULL,
          record_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES demo_sessions(session_id) ON DELETE CASCADE
        )
      `);
      console.log('✅ demo_data_tracking table created/verified');
    } catch (error) {
      console.log('❌ Failed to create demo_data_tracking table:', error.message);
    }

    // Create indexes
    console.log('\n⚡ Creating indexes...\n');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_demo_sessions_session_id ON demo_sessions(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_demo_sessions_expires_at ON demo_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_demo_data_tracking_session_id ON demo_data_tracking(session_id)'
    ];

    for (const indexSQL of indexes) {
      try {
        await connection.query(indexSQL);
        console.log('✅ Index created');
      } catch (error) {
        console.log('❌ Failed to create index:', error.message);
      }
    }

    // Check and fix clinics table
    console.log('\n🏥 Checking clinics table...\n');
    try {
      // Check if clinics table exists
      const [tables] = await connection.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'clinics'
         LIMIT 1`
      );

      if (tables.length === 0) {
        console.log('❌ Clinics table does not exist. Please run your main database setup first.');
        console.log('   Make sure you have run all the migration scripts for your clinic system.');
        return;
      }

      // Add missing columns to clinics table
      const columnsToAdd = [
        { name: 'address', type: 'VARCHAR(255) NULL' },
        { name: 'phone', type: 'VARCHAR(100) NULL' },
        { name: 'created_at', type: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP' }
      ];

      for (const col of columnsToAdd) {
        try {
          await connection.query(
            `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`
          );
          console.log(`✅ Added column '${col.name}' to clinics table`);
        } catch (error) {
          if (!error.message.includes('Duplicate column name')) {
            console.log(`❌ Failed to add column '${col.name}':`, error.message);
          } else {
            console.log(`✅ Column '${col.name}' already exists`);
          }
        }
      }
    } catch (error) {
      console.log('❌ Error checking clinics table:', error.message);
    }

    // Verify all required tables exist
    console.log('\n📋 Final verification...\n');
    const requiredTables = [
      'clinics', 'users', 'patients', 'daily_expenses', 'extra_income',
      'demo_sessions', 'demo_data_tracking'
    ];

    for (const table of requiredTables) {
      try {
        const [rows] = await connection.query(
          `SELECT 1 FROM information_schema.tables
           WHERE table_schema = DATABASE() AND table_name = ?
           LIMIT 1`,
          [table]
        );

        if (rows.length > 0) {
          console.log(`✅ Table '${table}' exists`);
        } else {
          console.log(`❌ Table '${table}' still missing - please check your database setup`);
        }
      } catch (error) {
        console.log(`❌ Error verifying table '${table}':`, error.message);
      }
    }

    console.log('\n🎉 Database fix completed!');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: node check_aiven_database.js (to verify everything works)');
    console.log('2. Start your backend: npm start');
    console.log('3. Start your frontend: npm run dev');
    console.log('4. Test the demo feature by clicking "Try Live Demo"');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Make sure your .env file has the correct Aiven credentials!');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixDatabase();