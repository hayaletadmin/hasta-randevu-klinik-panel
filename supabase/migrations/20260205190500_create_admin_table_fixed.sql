-- Create Admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow public read so login form can check
DROP POLICY IF EXISTS "Public Read Admins" ON admins;
CREATE POLICY "Public Read Admins" ON admins
FOR SELECT USING (true);

-- Allow admins to manage admins
DROP POLICY IF EXISTS "Public Manage Admins" ON admins;
CREATE POLICY "Public Manage Admins" ON admins
FOR ALL USING (true);

-- Seed the Master Admin
INSERT INTO admins (email, password, full_name)
VALUES ('harunirfan2000@gmail.com', 'admin123', 'Harun İrfan')
ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name;
