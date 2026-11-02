-- Sample data for testing. Run it once.

INSERT INTO users (email, password_hash, role) VALUES
    ('admin@clinic.ma', 'placeholder_hash_1', 'admin'),
    ('reception@clinic.ma', 'placeholder_hash_2', 'staff')
ON CONFLICT (email) DO NOTHING;

INSERT INTO patients (full_name, cin, phone, birth_date, address) VALUES
    ('Ahmed Benali', 'AB123456', '0600000001', '1990-05-14', 'Casablanca, Maarif'),
    ('Fatima Zahra El Idrissi', 'BK234567', '0600000002', '1985-11-02', 'Casablanca, Ain Sebaa'),
    ('Youssef Alaoui', 'CD345678', '0600000003', '2001-03-27', 'Mohammedia'),
    ('Salma Tazi', 'EE456789', '0600000004', '1978-08-19', NULL)
ON CONFLICT (cin) DO NOTHING;

INSERT INTO appointments (patient_id, appointment_date, status, reason, notes, created_by)
SELECT p.id, NOW() + INTERVAL '1 day', 'confirmed', 'Check-up', 'First visit', u.id
FROM patients p, users u
WHERE p.cin = 'AB123456' AND u.email = 'admin@clinic.ma';

INSERT INTO appointments (patient_id, appointment_date, status, reason, created_by)
SELECT p.id, NOW() + INTERVAL '2 days', 'pending', 'Follow-up consultation', u.id
FROM patients p, users u
WHERE p.cin = 'BK234567' AND u.email = 'reception@clinic.ma';

INSERT INTO appointments (patient_id, appointment_date, status, reason, created_by)
SELECT p.id, NOW() + INTERVAL '3 days', 'pending', 'Blood test results', u.id
FROM patients p, users u
WHERE p.cin = 'CD345678' AND u.email = 'reception@clinic.ma';

INSERT INTO appointments (patient_id, appointment_date, status, reason, notes, created_by)
SELECT p.id, NOW() - INTERVAL '5 days', 'cancelled', 'Consultation', 'Patient cancelled by phone', u.id
FROM patients p, users u
WHERE p.cin = 'EE456789' AND u.email = 'admin@clinic.ma';