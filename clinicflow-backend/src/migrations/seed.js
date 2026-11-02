const pool = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Clear existing data
    await pool.query('TRUNCATE TABLE appointments, patients, users RESTART IDENTITY CASCADE');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1 Admin, 2 Staff
    const userRes = await pool.query(`
      INSERT INTO users (email, password_hash, role) VALUES
      ('admin@clinicflow.com', $1, 'admin'),
      ('staff1@clinicflow.com', $1, 'staff'),
      ('staff2@clinicflow.com', $1, 'staff')
      RETURNING id, role;
    `, [hashedPassword]);

    const staffId = userRes.rows[1].id;

    // 5 Patients
    const patientRes = await pool.query(`
      INSERT INTO patients (full_name, cin, phone, birth_date, address) VALUES
      ('Ahmed Benali', 'AB12345', '+212611223344', '1985-04-12', '12 Boulevard Mohammed V, Rabat'),
      ('Fatima Zahra', 'FZ67890', '+212622334455', '1992-09-25', '45 Avenue Hassan II, Casablanca'),
      ('Youssef Alami', 'YA11223', '+212633445566', '1978-11-03', '8 Rue Ibn Sina, Marrakech'),
      ('Salma Bennani', 'SB44556', '+212644556677', '1995-06-18', '20 Suburb Agdal, Rabat'),
      ('Karim Tazi', 'KT77889', '+212655667788', '1988-01-30', '15 Medina, Fez')
      RETURNING id, full_name;
    `);

    const p = patientRes.rows;

    // 10 Appointments (mix of pending, confirmed, cancelled)
    await pool.query(`
      INSERT INTO appointments (patient_id, appointment_date, status, reason, notes, created_by) VALUES
      ($1, NOW() + INTERVAL '1 day', 'confirmed', 'General Checkup', 'Routine annual checkup', $6),
      ($2, NOW() + INTERVAL '2 days', 'pending', 'Dental Pain', 'Lower molar sensitivity', $6),
      ($3, NOW() + INTERVAL '3 hours', 'confirmed', 'Follow up', 'Blood pressure evaluation', $6),
      ($4, NOW() - INTERVAL '1 day', 'cancelled', 'Skin Rash', 'Cancelled by patient', $6),
      ($5, NOW() + INTERVAL '4 days', 'pending', 'Pediatric Consultation', 'Fever and cough', $6),
      ($1, NOW() + INTERVAL '5 days', 'pending', 'Cardiology', 'Palpitations check', $6),
      ($2, NOW() + INTERVAL '6 days', 'confirmed', 'Eye Examination', 'Blurry vision', $6),
      ($3, NOW() + INTERVAL '7 days', 'cancelled', 'Physical Therapy', 'Rescheduling needed', $6),
      ($4, NOW() + INTERVAL '8 days', 'confirmed', 'Diabetic Screening', 'Fast blood sugar test', $6),
      ($5, NOW() + INTERVAL '9 days', 'pending', 'Orthopedic Consult', 'Knee pain after running', $6)
    `, [p[0].id, p[1].id, p[2].id, p[3].id, p[4].id, staffId]);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();