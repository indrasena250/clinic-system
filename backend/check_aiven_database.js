// Database verification script for Aiven MySQL
// Run this to check if your database is properly set up for the demo feature

require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');

async function checkDatabase() {
  let connection;

  try {
    // You'll need to update these with your Aiven credentials
    connection = await mysql.createConnection({
      host: process.env.MYSQLHOST || 'YOUR_AIVEN_HOST',
      user: process.env.MYSQLUSER || 'YOUR_AIVEN_USER',
      password: process.env.MYSQLPASSWORD || 'YOUR_AIVEN_PASSWORD',
      database: process.env.MYSQLDATABASE || 'YOUR_AIVEN_DATABASE',
      port: process.env.MYSQLPORT || 3306,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    console.log('✅ Connected to Aiven database successfully!\n');

    // Check required tables
    const requiredTables = [
      'clinics',
      'users',
      'patients',
      'daily_expenses',
      'extra_income',
      'demo_sessions',
      'demo_data_tracking'
    ];

    console.log('📋 Checking required tables...\n');

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
          console.log(`❌ Table '${table}' MISSING`);
        }
      } catch (error) {
        console.log(`❌ Error checking table '${table}':`, error.message);
      }
    }

    console.log('\n🔍 Checking table structures...\n');

    // Check clinics table structure
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinics'
         ORDER BY ORDINAL_POSITION`
      );

      console.log('🏥 Clinics table structure:');
      const requiredClinicColumns = ['id', 'name', 'address', 'phone', 'created_at'];
      const existingColumns = columns.map(col => col.COLUMN_NAME);

      for (const reqCol of requiredClinicColumns) {
        if (existingColumns.includes(reqCol)) {
          console.log(`  ✅ Column '${reqCol}' exists`);
        } else {
          console.log(`  ❌ Column '${reqCol}' MISSING`);
        }
      }
    } catch (error) {
      console.log('❌ Error checking clinics table:', error.message);
    }

    // Check demo_sessions table structure
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'demo_sessions'
         ORDER BY ORDINAL_POSITION`
      );

      console.log('\n🎭 Demo sessions table structure:');
      const requiredDemoColumns = ['id', 'session_id', 'email', 'ip_address', 'user_agent', 'created_at', 'expires_at', 'is_active', 'data_deleted'];
      const existingColumns = columns.map(col => col.COLUMN_NAME);

      for (const reqCol of requiredDemoColumns) {
        if (existingColumns.includes(reqCol)) {
          console.log(`  ✅ Column '${reqCol}' exists`);
        } else {
          console.log(`  ❌ Column '${reqCol}' MISSING`);
        }
      }
    } catch (error) {
      console.log('❌ Error checking demo_sessions table:', error.message);
    }

    // Check demo_data_tracking table structure
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'demo_data_tracking'
         ORDER BY ORDINAL_POSITION`
      );

      console.log('\n📊 Demo data tracking table structure:');
      const requiredTrackingColumns = ['id', 'session_id', 'table_name', 'record_id', 'created_at'];
      const existingColumns = columns.map(col => col.COLUMN_NAME);

      for (const reqCol of requiredTrackingColumns) {
        if (existingColumns.includes(reqCol)) {
          console.log(`  ✅ Column '${reqCol}' exists`);
        } else {
          console.log(`  ❌ Column '${reqCol}' MISSING`);
        }
      }
    } catch (error) {
      console.log('❌ Error checking demo_data_tracking table:', error.message);
    }

    // Check indexes
    console.log('\n⚡ Checking indexes...\n');
    try {
      const [indexes] = await connection.query(
        `SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('demo_sessions', 'demo_data_tracking')
         ORDER BY TABLE_NAME, SEQ_IN_INDEX`
      );

      const indexMap = {};
      indexes.forEach(idx => {
        if (!indexMap[idx.TABLE_NAME]) indexMap[idx.TABLE_NAME] = [];
        indexMap[idx.TABLE_NAME].push(idx.INDEX_NAME);
      });

      const requiredIndexes = {
        'demo_sessions': ['idx_demo_sessions_session_id', 'idx_demo_sessions_expires_at'],
        'demo_data_tracking': ['idx_demo_data_tracking_session_id']
      };

      for (const [table, reqIndexes] of Object.entries(requiredIndexes)) {
        console.log(`Indexes for ${table}:`);
        for (const reqIdx of reqIndexes) {
          if (indexMap[table] && indexMap[table].includes(reqIdx)) {
            console.log(`  ✅ Index '${reqIdx}' exists`);
          } else {
            console.log(`  ❌ Index '${reqIdx}' MISSING`);
          }
        }
      }
    } catch (error) {
      console.log('❌ Error checking indexes:', error.message);
    }

    // Test demo functionality
    console.log('\n🧪 Testing demo functionality...\n');

    try {
      // Try to create a test demo session (this will be cleaned up)
      const testSessionId = 'test_' + Date.now();
      const testExpiresAt = new Date(Date.now() + 1000 * 60); // 1 minute from now

      await connection.query(
        `INSERT INTO demo_sessions (session_id, email, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [testSessionId, 'test@example.com', '127.0.0.1', 'Test User Agent', testExpiresAt]
      );

      console.log('✅ Demo session creation: SUCCESS');

      // Clean up test data
      await connection.query(
        `DELETE FROM demo_data_tracking WHERE session_id = ?`,
        [testSessionId]
      );
      await connection.query(
        `DELETE FROM demo_sessions WHERE session_id = ?`,
        [testSessionId]
      );

      console.log('✅ Demo session cleanup: SUCCESS');

    } catch (error) {
      console.log('❌ Demo functionality test FAILED:', error.message);
    }

    console.log('\n🎉 Database check completed!');
    console.log('\n📝 Summary:');
    console.log('- If you see any ❌ MISSING items, run the CREATE_DEMO_TABLES.sql script');
    console.log('- Make sure your .env file has the correct Aiven database credentials');
    console.log('- Test the demo feature by visiting your frontend and clicking "Try Live Demo"');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has correct Aiven credentials:');
    console.log('   - MYSQLHOST');
    console.log('   - MYSQLUSER');
    console.log('   - MYSQLPASSWORD');
    console.log('   - MYSQLDATABASE');
    console.log('   - MYSQLPORT');
    console.log('2. Make sure your Aiven database allows connections from your IP');
    console.log('3. Verify SSL settings if required by Aiven');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabase();