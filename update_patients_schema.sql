-- Run this script in your Supabase SQL Editor to add the missing columns

-- Add doctor_id column to patients table and set up Foreign Key relationship
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES doctors(id);

-- Add group_id column to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS group_id text;

-- Optional: Add an index for doctor_id for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
