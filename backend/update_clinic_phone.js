const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

async function updateClinicPhone() {
  dotenv.config();

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinic_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Adding phone column to clinics table...');

    // Add phone column if it doesn't exist
    try {
      await pool.query('ALTER TABLE clinics ADD COLUMN phone VARCHAR(100) NULL');
      console.log('✓ Phone column added');
    } catch (err) {
      if (err.message.includes('Duplicate column name')) {
        console.log('✓ Phone column already exists');
      } else {
        throw err;
      }
    }

    // Set phone numbers for clinic 2
    const [result] = await pool.query(
      "UPDATE clinics SET phone = '8977419348, 8977449348' WHERE id = 2"
    );
    console.log(`✓ Updated ${result.affectedRows} clinic(s) with phone number`);

    // Show current clinic data
    const [rows] = await pool.query('SELECT id, name, phone FROM clinics');
    console.log('\nCurrent clinics:');
    rows.forEach(clinic => {
      console.log(`Clinic ${clinic.id}: ${clinic.name} - Phone: ${clinic.phone || 'Not set'}`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

updateClinicPhone();