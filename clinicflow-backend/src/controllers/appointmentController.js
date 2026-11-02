const pool = require('../config/db');

const getAppointments = async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = `
      SELECT a.*, p.full_name as patient_name, p.cin as patient_cin, p.phone as patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by calendar date safely
    if (date && date.trim() !== '' && date !== 'undefined' && date !== 'null') {
      params.push(date);
      query += ` AND a.appointment_date::date = $${params.length}::date`;
    }

    // Filter by status (cast enum to text so LOWER() works without 500 errors)
    if (status && status !== 'ALL' && status.trim() !== '' && status !== 'undefined') {
      params.push(status);
      query += ` AND LOWER(a.status::text) = LOWER($${params.length})`;
    }

    query += ' ORDER BY a.appointment_date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { patientId, appointmentDate, reason, notes } = req.body;
    const userId = req.user.id;

    // MANDATORY BUSINESS RULE: No 2 confirmed appointments within 30 minutes
    const conflictQuery = `
      SELECT id FROM appointments 
      WHERE patient_id = $1 
        AND status = 'confirmed' 
        AND appointment_date >= ($2::timestamptz - INTERVAL '30 minutes')
        AND appointment_date <= ($2::timestamptz + INTERVAL '30 minutes')
    `;
    const conflictCheck = await pool.query(conflictQuery, [patientId, appointmentDate]);

    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'Business Rule Violation: Patient already has a confirmed appointment within a 30-minute window.',
      });
    }

    const insertQuery = `
      INSERT INTO appointments (patient_id, appointment_date, status, reason, notes, created_by)
      VALUES ($1, $2, 'pending', $3, $4, $5)
      RETURNING *
    `;
    const newAppointment = await pool.query(insertQuery, [patientId, appointmentDate, reason, notes || null, userId]);

    res.status(201).json(newAppointment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // pending, confirmed, cancelled

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (status === 'confirmed') {
      const apptResult = await pool.query('SELECT patient_id, appointment_date FROM appointments WHERE id = $1', [id]);
      if (apptResult.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
      
      const { patient_id, appointment_date } = apptResult.rows[0];

      const conflictQuery = `
        SELECT id FROM appointments 
        WHERE patient_id = $1 
          AND status = 'confirmed' 
          AND id != $2
          AND appointment_date >= ($3::timestamptz - INTERVAL '30 minutes')
          AND appointment_date <= ($3::timestamptz + INTERVAL '30 minutes')
      `;
      const conflictCheck = await pool.query(conflictQuery, [patient_id, id, appointment_date]);

      if (conflictCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'Business Rule Violation: Cannot confirm. Patient has another confirmed appointment within 30 minutes.',
        });
      }
    }

    const updateQuery = `
      UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
    `;
    const updated = await pool.query(updateQuery, [status, id]);

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



const getDashboardStats = async (req, res) => {
  try {
    const totalPatientsQuery = pool.query('SELECT COUNT(*) FROM patients');
    const todayAppointmentsQuery = pool.query(`
      SELECT COUNT(*) FROM appointments 
      WHERE DATE(appointment_date) = CURRENT_DATE
    `);
    const pendingQuery = pool.query("SELECT COUNT(*) FROM appointments WHERE status = 'pending'");
    const confirmedQuery = pool.query("SELECT COUNT(*) FROM appointments WHERE status = 'confirmed'");

    const [totalPatients, todayAppts, pending, confirmed] = await Promise.all([
      totalPatientsQuery,
      todayAppointmentsQuery,
      pendingQuery,
      confirmedQuery,
    ]);

    res.json({
      totalPatients: parseInt(totalPatients.rows[0].count),
      todaysAppointments: parseInt(todayAppts.rows[0].count),
      pendingAppointments: parseInt(pending.rows[0].count),
      confirmedAppointments: parseInt(confirmed.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAppointments, createAppointment, updateAppointmentStatus, getDashboardStats };