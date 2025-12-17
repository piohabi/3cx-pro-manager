-- 3CX Pro Manager - Database Setup Script
-- Run this script in your Supabase SQL Editor to set up the database

-- ============================================
-- DROP EXISTING TABLES (if any)
-- ============================================

DROP TABLE IF EXISTS maintenance CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Create users table (for authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  company VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  microsoft_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create licenses table
CREATE TABLE licenses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  license_key VARCHAR(255) NOT NULL UNIQUE,
  license_type VARCHAR(100),
  max_users INTEGER,
  purchase_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  system_url VARCHAR(255),
  system_username VARCHAR(255),
  system_password VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create maintenance table
CREATE TABLE maintenance (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  license_id INTEGER REFERENCES licenses(id) ON DELETE SET NULL,
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  technician VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================

CREATE INDEX idx_licenses_customer_id ON licenses(customer_id);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expiry_date ON licenses(expiry_date);
CREATE INDEX idx_maintenance_customer_id ON maintenance(customer_id);
CREATE INDEX idx_maintenance_license_id ON maintenance(license_id);
CREATE INDEX idx_maintenance_status ON maintenance(status);
CREATE INDEX idx_maintenance_scheduled_date ON maintenance(scheduled_date);
CREATE INDEX idx_customers_company_name ON customers(company_name);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================
-- Note: These policies allow all access for now.
-- In production, you should implement proper authentication
-- and restrict access based on user roles.

-- Policies for customers table
CREATE POLICY "Enable all access for customers" 
  ON customers 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Policies for licenses table
CREATE POLICY "Enable all access for licenses" 
  ON licenses 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Policies for maintenance table
CREATE POLICY "Enable all access for maintenance" 
  ON maintenance 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- CREATE FUNCTIONS FOR UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE TRIGGERS
-- ============================================

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment the following lines to insert sample data:

/*
-- Sample customer
INSERT INTO customers (company_name, contact_person, email, phone, address, notes)
VALUES 
  ('Acme Corporation', 'John Doe', 'john.doe@acme.com', '+1-555-0100', '123 Business Street, New York, NY 10001', 'Premium customer'),
  ('Tech Solutions Ltd', 'Jane Smith', 'jane.smith@techsolutions.com', '+1-555-0200', '456 Tech Avenue, San Francisco, CA 94105', 'Enterprise client'),
  ('Global Telecom', 'Bob Johnson', 'bob.johnson@globaltel.com', '+1-555-0300', '789 Telecom Plaza, Chicago, IL 60601', 'Large enterprise');

-- Sample licenses
INSERT INTO licenses (customer_id, license_key, license_type, max_users, purchase_date, expiry_date, status, system_url, notes)
VALUES 
  (1, 'LIC-ACME-2024-001', 'Professional', 50, '2024-01-15', '2025-01-15', 'active', 'https://pbx.acme.com', 'Annual license'),
  (2, 'LIC-TECH-2024-002', 'Enterprise', 100, '2024-02-01', '2025-02-01', 'active', 'https://pbx.techsolutions.com', 'Enterprise plan with support'),
  (3, 'LIC-GLOB-2024-003', 'Enterprise', 200, '2024-03-01', '2025-03-01', 'active', 'https://pbx.globaltel.com', 'Multi-site deployment');

-- Sample maintenance records
INSERT INTO maintenance (customer_id, license_id, maintenance_type, description, status, scheduled_date, technician, notes)
VALUES 
  (1, 1, 'System Update', 'Quarterly system update and security patches', 'completed', '2024-04-01 10:00:00', 'Tech Team A', 'Completed successfully'),
  (2, 2, 'Configuration Review', 'Annual configuration and performance review', 'scheduled', '2024-12-15 14:00:00', 'Tech Team B', 'Scheduled for next month'),
  (3, 3, 'Emergency Support', 'Urgent call quality issues reported', 'in_progress', '2024-11-20 09:00:00', 'Tech Team C', 'Working on resolution');
*/

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check if tables were created successfully
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM 
  information_schema.tables t
WHERE 
  table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('customers', 'licenses', 'maintenance, 'users', 'licenses', 'maintenance')
ORDER BY 
  table_name;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Your database is now ready to use!
-- Next steps:
-- 1. Update your .env file with database credentials
-- 2. Deploy your application to Render
-- 3. Test the connection
-- ============================================
