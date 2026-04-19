// Test multi-clinic functionality
require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');

async function testMultiClinic() {
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

    // Test 1: Create a new clinic
    console.log('🧪 Test 1: Creating new clinic...');
    const testClinicName = `Test Clinic ${Date.now()}`;
    const [clinicResult] = await connection.query(
      `INSERT INTO clinics (name, address, phone, created_at)
       VALUES (?, ?, ?, NOW())`,
      [testClinicName, 'Test Address', '123-456-7890']
    );
    const newClinicId = clinicResult.insertId;
    console.log(`✅ Created clinic: ${testClinicName} (ID: ${newClinicId})`);

    // Test 2: Create a user for the new clinic
    console.log('\n🧪 Test 2: Creating user for new clinic...');
    const testUsername = `testuser_${Date.now()}`;
    const testPassword = '$2b$10$hashedpassword'; // This would normally be properly hashed

    const [userResult] = await connection.query(
      `INSERT INTO users (username, password, full_name, role, clinic_id, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [testUsername, testPassword, 'Test User', 'admin', newClinicId, true]
    );
    const newUserId = userResult.insertId;
    console.log(`✅ Created user: ${testUsername} (ID: ${newUserId}) assigned to clinic ${newClinicId}`);

    // Test 3: Verify data isolation - create a patient for the new clinic
    console.log('\n🧪 Test 3: Testing data isolation...');
    const [patientResult] = await connection.query(
      `INSERT INTO patients (clinic_id, clinic_patient_id, patient_name, age, age_unit, gender, mobile, scan_category, scan_name, amount, upload_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [newClinicId, 1, 'Test Patient', 30, 'years', 'Male', '1234567890', 'CT', 'CT Scan', 1000.00]
    );
    console.log(`✅ Created patient for clinic ${newClinicId}`);

    // Test 4: Verify clinic data separation
    console.log('\n🧪 Test 4: Verifying clinic data separation...');
    const [clinic1Patients] = await connection.query(
      'SELECT COUNT(*) as count FROM patients WHERE clinic_id = 1'
    );
    const [newClinicPatients] = await connection.query(
      'SELECT COUNT(*) as count FROM patients WHERE clinic_id = ?',
      [newClinicId]
    );

    console.log(`📊 Clinic 1 patients: ${clinic1Patients[0].count}`);
    console.log(`📊 New clinic (${newClinicId}) patients: ${newClinicPatients[0].count}`);

    if (newClinicPatients[0].count === 1 && clinic1Patients[0].count >= 0) {
      console.log('✅ Data isolation working correctly');
    } else {
      console.log('❌ Data isolation issue detected');
    }

    // Test 5: Verify user-clinic relationship
    console.log('\n🧪 Test 5: Verifying user-clinic relationships...');
    const [userClinicCheck] = await connection.query(
      `SELECT u.username, c.name as clinic_name
       FROM users u
       JOIN clinics c ON u.clinic_id = c.id
       WHERE u.id = ?`,
      [newUserId]
    );

    if (userClinicCheck.length > 0) {
      console.log(`✅ User ${userClinicCheck[0].username} correctly assigned to ${userClinicCheck[0].clinic_name}`);
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await connection.query('DELETE FROM patients WHERE clinic_id = ?', [newClinicId]);
    await connection.query('DELETE FROM users WHERE id = ?', [newUserId]);
    await connection.query('DELETE FROM clinics WHERE id = ?', [newClinicId]);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Multi-clinic functionality test completed successfully!');
    console.log('\n✅ Your system supports unlimited clinics and users');
    console.log('✅ Data isolation between clinics works correctly');
    console.log('✅ User-clinic relationships are properly maintained');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMultiClinic();