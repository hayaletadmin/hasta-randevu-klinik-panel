-- Enable Row Level Security (RLS) for tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Create policies for Departments table
-- Allow anyone to read departments
CREATE POLICY "Public Read Departments" ON departments
FOR SELECT USING (true);

-- Allow insert/update/delete for authenticated/anon users (Warning: This allows ANYONE to modify. Only for dev/admin)
-- Ideally, restricting this to specific roles is better, but for this admin panel setup:
CREATE POLICY "Public Insert Departments" ON departments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Update Departments" ON departments
FOR UPDATE USING (true);

CREATE POLICY "Public Delete Departments" ON departments
FOR DELETE USING (true);


-- Create policies for Doctors table
-- Allow anyone to read doctors
CREATE POLICY "Public Read Doctors" ON doctors
FOR SELECT USING (true);

-- Allow insert/update/delete for authenticated/anon users
CREATE POLICY "Public Insert Doctors" ON doctors
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Update Doctors" ON doctors
FOR UPDATE USING (true);

CREATE POLICY "Public Delete Doctors" ON doctors
FOR DELETE USING (true);
