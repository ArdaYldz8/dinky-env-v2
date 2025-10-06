-- Separate user roles from employees table
-- This migration creates a dedicated user_roles table independent of employees

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'usta',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_id UNIQUE(user_id),
  CONSTRAINT unique_email UNIQUE(email)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- 4. Migrate existing data from employees to user_roles
INSERT INTO user_roles (user_id, email, role, is_active)
SELECT
  e.user_id,
  e.email,
  e.role,
  e.is_active
FROM employees e
WHERE e.user_id IS NOT NULL
  AND e.email IS NOT NULL
  AND e.role IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 5. Update get_user_role function to use user_roles table
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for user_roles
CREATE POLICY "User roles: Full access for patron and admin"
  ON user_roles FOR ALL
  USING (
    get_user_role(auth.uid()) IN ('patron', 'admin')
  );

CREATE POLICY "User roles: Read access for genel_mudur"
  ON user_roles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'genel_mudur'
  );

CREATE POLICY "User roles: Self read for all authenticated users"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- 8. Make employees.user_id nullable and remove role dependency
-- Keep user_id in employees for optional linking but not required
ALTER TABLE employees
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN role DROP NOT NULL;

-- 9. Create a view to see complete user information
CREATE OR REPLACE VIEW complete_user_info AS
SELECT
  ur.id as user_role_id,
  ur.user_id,
  ur.email as auth_email,
  ur.role,
  ur.is_active as account_active,
  e.id as employee_id,
  e.full_name,
  e.position,
  e.department,
  e.is_active as employee_active,
  u.created_at as user_created_at,
  ur.created_at as role_created_at
FROM user_roles ur
LEFT JOIN auth.users u ON ur.user_id = u.id
LEFT JOIN employees e ON e.user_id = ur.user_id
ORDER BY
  CASE ur.role
    WHEN 'patron' THEN 1
    WHEN 'genel_mudur' THEN 2
    WHEN 'muhasebeci' THEN 3
    WHEN 'depocu' THEN 4
    WHEN 'usta' THEN 5
    WHEN 'admin' THEN 6
    ELSE 7
  END,
  ur.email;

-- 10. Add comments
COMMENT ON TABLE user_roles IS 'User authentication roles - independent of employee records';
COMMENT ON COLUMN user_roles.user_id IS 'Reference to auth.users - CASCADE delete when user is deleted';
COMMENT ON COLUMN user_roles.email IS 'User email for login - must match auth.users email';
COMMENT ON COLUMN user_roles.role IS 'Access control role - determines permissions';
COMMENT ON COLUMN employees.user_id IS 'Optional link to auth user - employee can exist without user account';
COMMENT ON VIEW complete_user_info IS 'Complete view of users with their roles and employee information';
