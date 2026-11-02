const pool = require('../config/db');

const getPatients = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const query = `
      SELECT * FROM patients 
      WHERE full_name ILIKE $1 OR cin ILIKE $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `
      SELECT COUNT(*) FROM patients 
      WHERE full_name ILIKE $1 OR cin ILIKE $1
    `;

    const searchParam = `%${search}%`;
    const [patients, countResult] = await Promise.all([
      pool.query(query, [searchParam, parseInt(limit), offset]),
      pool.query(countQuery, [searchParam]),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: patients.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const appointmentsResult = await pool.query(
      'SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC',
      [id]
    );

    res.json({
      patient: patientResult.rows[0],
      appointments: appointmentsResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPatient = async (req, res) => {
  try {
    const { fullName, cin, phone, birthDate, address } = req.body;
    
    const existing = await pool.query('SELECT id FROM patients WHERE cin = $1', [cin]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Patient with this CIN already exists' });
    }

    const query = `
      INSERT INTO patients (full_name, cin, phone, birth_date, address) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const values = [fullName, cin, phone, birthDate || null, address || null];
    const newPatient = await pool.query(query, values);

    res.status(201).json(newPatient.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, cin, phone, birthDate, address } = req.body;

    const query = `
      UPDATE patients 
      SET full_name = $1, cin = $2, phone = $3, birth_date = $4, address = $5, updated_at = NOW()
      WHERE id = $6 RETURNING *
    `;
    const values = [fullName, cin, phone, birthDate, address, id];
    const updated = await pool.query(query, values);

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deletePatient = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Use a database transaction to ensure atomicity
    await client.query('BEGIN');

    // 1. Delete all associated appointments first
    await client.query('DELETE FROM appointments WHERE patient_id = $1', [id]);

    // 2. Delete the patient record
    const deleted = await client.query('DELETE FROM patients WHERE id = $1 RETURNING id', [id]);

    if (deleted.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Patient not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Patient and all associated appointments deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting patient:', err);
    res.status(500).json({ error: 'Failed to delete patient record' });
  } finally {
    client.release();
  }
};

module.exports = { getPatients, getPatientById, createPatient, updatePatient, deletePatient };