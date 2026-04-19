// Quick clinic check script
require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');

async function checkClinics() {
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

    console.log('✅ Connected to database\n');

    // Count clinics
    const [countResult] = await connection.query('SELECT COUNT(*) as clinic_count FROM clinics');
    console.log('📊 Total clinics in database:', countResult[0].clinic_count);

    // List all clinics
    const [clinics] = await connection.query('SELECT id, name FROM clinics ORDER BY id');
    console.log('\n🏥 Clinic list:');
    clinics.forEach(c => {
      console.log(`  ${c.id}: ${c.name}`);
    });

    // Check users and their clinic assignments
    const [users] = await connection.query(`
      SELECT u.id, u.username, u.full_name, u.role, c.name as clinic_name
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      ORDER BY u.id
    `);

    console.log('\n👥 Users and their clinic assignments:');
    users.forEach(user => {
      console.log(`  ${user.username} (${user.role}) -> ${user.clinic_name || 'No clinic'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkClinics();