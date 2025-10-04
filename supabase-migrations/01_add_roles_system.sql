-- Add roles to employees table
-- This migration adds role-based access control to the system

-- 1. Create role enum type
CREATE TYPE user_role AS ENUM (
  'patron',           -- Patron (Full access)
  'genel_mudur',      -- Genel Müdür (Full access except settings)
  'muhasebeci',       -- Muhasebeci (Finance, reports, customers)
  'depocu',           -- Depocu (Stock management)
  'usta',             -- Usta (Quality control only)
  'admin'             -- Admin (System administration)
);

-- 2. Add email, role, and user_id columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'usta',
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- 4. Insert 9 employee records for the accounts
INSERT INTO employees (full_name, email, phone, department, position, role, is_active) VALUES
('Ahmet Yıldırım', 'patron@dinky.com', '0532 111 1111', 'Yönetim', 'Patron', 'patron', true),
('Mehmet Demir', 'genelmudur@dinky.com', '0532 222 2222', 'Yönetim', 'Genel Müdür', 'genel_mudur', true),
('Ayşe Kaya', 'muhasebe@dinky.com', '0532 333 3333', 'Muhasebe', 'Muhasebeci', 'muhasebeci', true),
('Fatma Çelik', 'depo@dinky.com', '0532 444 4444', 'Lojistik', 'Depo Sorumlusu', 'depocu', true),
('Ali Yılmaz', 'usta1@dinky.com', '0532 555 5551', 'Üretim', 'Kalite Kontrol Ustası', 'usta', true),
('Veli Öztürk', 'usta2@dinky.com', '0532 555 5552', 'Üretim', 'Kalite Kontrol Ustası', 'usta', true),
('Hasan Arslan', 'usta3@dinky.com', '0532 555 5553', 'Üretim', 'Kalite Kontrol Ustası', 'usta', true),
('Hüseyin Koç', 'usta4@dinky.com', '0532 555 5554', 'Üretim', 'Kalite Kontrol Ustası', 'usta', true),
('İbrahim Aydın', 'usta5@dinky.com', '0532 555 5555', 'Üretim', 'Kalite Kontrol Ustası', 'usta', true)
ON CONFLICT DO NOTHING;

-- 5. Create a function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS user_role AS $$
  SELECT role FROM employees WHERE user_id = user_uuid LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Create RLS policies for role-based access

-- Disable existing RLS if any
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE quality_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Employees table policies
CREATE POLICY "Employees: Full access for patron and genel_mudur"
  ON employees FOR ALL
  USING (
    get_user_role(auth.uid()) IN ('patron', 'genel_mudur', 'admin')
  );

CREATE POLICY "Employees: Read access for muhasebeci"
  ON employees FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'muhasebeci'
  );

CREATE POLICY "Employees: Self read for all"
  ON employees FOR SELECT
  USING (user_id = auth.uid());

-- Projects table policies
CREATE POLICY "Projects: Full access for patron, genel_mudur"
  ON projects FOR ALL
  USING (
    get_user_role(auth.uid()) IN ('patron', 'genel_mudur', 'admin')
  );

CREATE POLICY "Projects: Read/Update for muhasebeci"
  ON projects FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'muhasebeci'
  );

-- Stock table policies
CREATE POLICY "Stock: Full access for patron, genel_mudur, depocu"
  ON stock_items FOR ALL
  USING (
    get_user_role(auth.uid()) IN ('patron', 'genel_mudur', 'depocu', 'admin')
  );

CREATE POLICY "Stock: Read for muhasebeci"
  ON stock_items FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'muhasebeci'
  );

-- Quality issues policies (Ustalar için özel erişim)
CREATE POLICY "Quality: Full access for patron, genel_mudur, usta"
  ON quality_issues FOR ALL
  USING (
    get_user_role(auth.uid()) IN ('patron', 'genel_mudur', 'usta', 'admin')
  );

-- Customers table policies
CREATE POLICY "Customers: Full access for patron, genel_mudur, muhasebeci"
  ON customers FOR ALL
  USING (
    get_user_role(auth.uid()) IN ('patron', 'genel_mudur', 'muhasebeci', 'admin')
  );

CREATE POLICY "Customers: Read for others"
  ON customers FOR SELECT
  USING (true);

COMMENT ON TYPE user_role IS 'User roles for role-based access control';
COMMENT ON COLUMN employees.role IS 'User role for access control';
COMMENT ON COLUMN employees.user_id IS 'Reference to auth.users for authentication';
