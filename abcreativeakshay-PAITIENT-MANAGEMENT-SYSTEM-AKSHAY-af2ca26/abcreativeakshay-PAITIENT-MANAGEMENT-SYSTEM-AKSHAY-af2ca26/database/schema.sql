-- Patient Management System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- DDL (Data Definition Language)
-- ============================================

-- Patients Table (1NF, 2NF, 3NF compliant)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT patients_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Doctors Table (1NF, 2NF, 3NF compliant)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT doctors_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Appointments Table (Normalized - no transitive dependencies)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_appointment UNIQUE (patient_id, doctor_id, appointment_date)
);

-- Prescriptions Table (Normalized)
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    medication VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    instructions TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical Records Table (Normalized)
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    diagnosis TEXT NOT NULL,
    treatment TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);

-- ============================================
-- VIEWS
-- ============================================

-- View: Complete Appointment Details with Patient and Doctor Info
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
    a.id,
    a.appointment_date,
    a.status,
    a.notes,
    p.first_name || ' ' || p.last_name AS patient_name,
    p.phone AS patient_phone,
    p.email AS patient_email,
    d.first_name || ' ' || d.last_name AS doctor_name,
    d.specialization AS doctor_specialization,
    d.phone AS doctor_phone
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id;

-- View: Patient Medical History
CREATE OR REPLACE VIEW patient_medical_history AS
SELECT 
    p.id AS patient_id,
    p.first_name || ' ' || p.last_name AS patient_name,
    mr.record_date,
    mr.diagnosis,
    mr.treatment,
    mr.notes
FROM patients p
JOIN medical_records mr ON p.id = mr.patient_id
ORDER BY mr.record_date DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Get Patient Age
CREATE OR REPLACE FUNCTION get_patient_age(patient_id UUID)
RETURNS INTEGER AS $$
DECLARE
    patient_dob DATE;
BEGIN
    SELECT date_of_birth INTO patient_dob
    FROM patients
    WHERE id = patient_id;
    
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, patient_dob));
END;
$$ LANGUAGE plpgsql;

-- Function: Get Doctor's Appointment Count
CREATE OR REPLACE FUNCTION get_doctor_appointment_count(
    doctor_id UUID,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM appointments
        WHERE doctor_id = $1
        AND DATE(appointment_date) BETWEEN start_date AND end_date
        AND status != 'cancelled'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure: Cancel Appointment with Reason
CREATE OR REPLACE PROCEDURE cancel_appointment(
    appointment_id UUID,
    cancellation_reason TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE appointments
    SET status = 'cancelled',
        notes = COALESCE(notes || E'\n\nCancellation Reason: ', 'Cancellation Reason: ') || cancellation_reason
    WHERE id = appointment_id;
    
    RAISE NOTICE 'Appointment % cancelled successfully', appointment_id;
END;
$$;

-- Procedure: Complete Appointment and Add Prescription
CREATE OR REPLACE PROCEDURE complete_appointment_with_prescription(
    appointment_id UUID,
    medication VARCHAR(255),
    dosage VARCHAR(100),
    instructions TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update appointment status
    UPDATE appointments
    SET status = 'completed'
    WHERE id = appointment_id;
    
    -- Insert prescription
    INSERT INTO prescriptions (appointment_id, medication, dosage, instructions)
    VALUES (appointment_id, medication, dosage, instructions);
    
    RAISE NOTICE 'Appointment completed and prescription added';
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger Function: Update appointment count after insert
CREATE OR REPLACE FUNCTION log_appointment_creation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'New appointment created: Patient %, Doctor %, Date %',
        NEW.patient_id, NEW.doctor_id, NEW.appointment_date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_appointment_insert
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION log_appointment_creation();

-- Trigger Function: Validate appointment date (allow scheduling for any date)
CREATE OR REPLACE FUNCTION validate_appointment_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate that the date is not more than 5 years in the past
    -- This allows flexibility for backdating appointments and historical records
    IF NEW.appointment_date < (NOW() - INTERVAL '5 years') THEN
        RAISE EXCEPTION 'Appointment date is too far in the past';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_appointment_date
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION validate_appointment_date();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on patients" ON patients;
DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow all operations on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all operations on prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Allow all operations on medical_records" ON medical_records;

-- For now, allow all operations (you can customize these policies)
CREATE POLICY "Allow all operations on patients" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all operations on doctors" ON doctors FOR ALL USING (true);
CREATE POLICY "Allow all operations on appointments" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all operations on prescriptions" ON prescriptions FOR ALL USING (true);
CREATE POLICY "Allow all operations on medical_records" ON medical_records FOR ALL USING (true);

-- ============================================
-- SAMPLE DML (Data Manipulation Language)
-- ============================================

-- Insert Sample Doctors (only if table is empty)
INSERT INTO doctors (first_name, last_name, specialization, phone, email)
SELECT 'John', 'Smith', 'Cardiology', '+1-555-0101', 'john.smith@hospital.com'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE email = 'john.smith@hospital.com');

INSERT INTO doctors (first_name, last_name, specialization, phone, email)
SELECT 'Sarah', 'Johnson', 'Pediatrics', '+1-555-0102', 'sarah.johnson@hospital.com'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE email = 'sarah.johnson@hospital.com');

INSERT INTO doctors (first_name, last_name, specialization, phone, email)
SELECT 'Michael', 'Brown', 'Orthopedics', '+1-555-0103', 'michael.brown@hospital.com'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE email = 'michael.brown@hospital.com');

INSERT INTO doctors (first_name, last_name, specialization, phone, email)
SELECT 'Emily', 'Davis', 'Dermatology', '+1-555-0104', 'emily.davis@hospital.com'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE email = 'emily.davis@hospital.com');

-- Insert Sample Patients (only if table is empty)
INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address)
SELECT 'Alice', 'Williams', '1990-05-15', 'Female', '+1-555-1001', 'alice.williams@email.com', '123 Main St, New York, NY 10001'
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE email = 'alice.williams@email.com');

INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address)
SELECT 'Bob', 'Miller', '1985-08-22', 'Male', '+1-555-1002', 'bob.miller@email.com', '456 Oak Ave, Los Angeles, CA 90001'
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE email = 'bob.miller@email.com');

INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address)
SELECT 'Carol', 'Garcia', '1995-03-10', 'Female', '+1-555-1003', 'carol.garcia@email.com', '789 Pine Rd, Chicago, IL 60601'
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE email = 'carol.garcia@email.com');
