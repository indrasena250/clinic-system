require("dotenv").config();
const mysql = require("mysql2/promise");

async function checkDatabase() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    console.log("✅ Connected to database successfully\n");

    // Check all tables
    console.log("📋 CHECKING TABLES:");
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Found tables:", tables.map(row => Object.values(row)[0]));

    // Required tables for demo feature
    const requiredTables = [
      'clinics', 'users', 'patients', 'ct_scans', 'ultrasound_scans',
      'doctor_referrals', 'settlements', 'daily_expenses', 'extra_income',
      'demo_sessions', 'demo_data_tracking'
    ];

    console.log("\n🔍 CHECKING REQUIRED TABLES:");
    for (const table of requiredTables) {
      const exists = tables.some(row => Object.values(row)[0] === table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    }

    // Check demo tables structure
    console.log("\n📊 CHECKING DEMO TABLES STRUCTURE:");

    // Check demo_sessions table
    try {
      const [columns] = await connection.query("DESCRIBE demo_sessions");
      console.log("✅ demo_sessions columns:", columns.map(col => col.Field).join(', '));

      const requiredColumns = ['id', 'session_id', 'email', 'ip_address', 'user_agent', 'created_at', 'expires_at', 'is_active', 'data_deleted'];
      const missingColumns = requiredColumns.filter(col => !columns.some(c => c.Field === col));
      if (missingColumns.length > 0) {
        console.log("❌ Missing columns in demo_sessions:", missingColumns.join(', '));
      }
    } catch (error) {
      console.log("❌ demo_sessions table error:", error.message);
    }

    // Check demo_data_tracking table
    try {
      const [columns] = await connection.query("DESCRIBE demo_data_tracking");
      console.log("✅ demo_data_tracking columns:", columns.map(col => col.Field).join(', '));

      const requiredColumns = ['id', 'session_id', 'table_name', 'record_id', 'created_at'];
      const missingColumns = requiredColumns.filter(col => !columns.some(c => c.Field === col));
      if (missingColumns.length > 0) {
        console.log("❌ Missing columns in demo_data_tracking:", missingColumns.join(', '));
      }
    } catch (error) {
      console.log("❌ demo_data_tracking table error:", error.message);
    }

    // Check clinics table
    console.log("\n🏥 CHECKING CLINICS TABLE:");
    try {
      const [columns] = await connection.query("DESCRIBE clinics");
      console.log("✅ clinics columns:", columns.map(col => col.Field).join(', '));

      const requiredColumns = ['id', 'name', 'address', 'phone', 'created_at'];
      const missingColumns = requiredColumns.filter(col => !columns.some(c => c.Field === col));
      if (missingColumns.length > 0) {
        console.log("❌ Missing columns in clinics:", missingColumns.join(', '));
      } else {
        console.log("✅ All required clinic columns present");
      }
    } catch (error) {
      console.log("❌ clinics table error:", error.message);
    }

    // Check other important tables
    console.log("\n📋 CHECKING OTHER TABLES:");
    const otherTables = ['users', 'patients', 'daily_expenses', 'extra_income'];

    for (const table of otherTables) {
      try {
        const [columns] = await connection.query(`DESCRIBE ${table}`);
        const hasClinicId = columns.some(col => col.Field === 'clinic_id');
        console.log(`${hasClinicId ? '✅' : '❌'} ${table} has clinic_id column`);
      } catch (error) {
        console.log(`❌ ${table} table error:`, error.message);
      }
    }

    // Check indexes
    console.log("\n🔍 CHECKING INDEXES:");
    try {
      const [indexes] = await connection.query("SHOW INDEX FROM demo_sessions");
      const indexNames = indexes.map(idx => idx.Key_name);
      console.log("demo_sessions indexes:", indexNames.join(', '));

      const requiredIndexes = ['PRIMARY', 'idx_demo_sessions_session_id', 'idx_demo_sessions_expires_at'];
      const missingIndexes = requiredIndexes.filter(idx => !indexNames.includes(idx));
      if (missingIndexes.length > 0) {
        console.log("❌ Missing indexes in demo_sessions:", missingIndexes.join(', '));
      } else {
        console.log("✅ All required demo_sessions indexes present");
      }
    } catch (error) {
      console.log("❌ Error checking indexes:", error.message);
    }

    // Check sample data
    console.log("\n📊 CHECKING SAMPLE DATA:");
    try {
      const [clinics] = await connection.query("SELECT COUNT(*) as count FROM clinics");
      console.log(`✅ Clinics count: ${clinics[0].count}`);

      const [demoSessions] = await connection.query("SELECT COUNT(*) as count FROM demo_sessions");
      console.log(`✅ Demo sessions count: ${demoSessions[0].count}`);

      const [demoData] = await connection.query("SELECT COUNT(*) as count FROM demo_data_tracking");
      console.log(`✅ Demo data tracking count: ${demoData[0].count}`);
    } catch (error) {
      console.log("❌ Error checking sample data:", error.message);
    }

  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabase();