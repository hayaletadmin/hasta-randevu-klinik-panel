-- Add color column to doctors table
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6'; -- Default blue-500
