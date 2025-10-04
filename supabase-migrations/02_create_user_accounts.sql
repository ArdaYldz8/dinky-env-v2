-- Create user accounts in Supabase Auth
-- Note: This SQL creates the user records in auth.users
-- Passwords will need to be set via Supabase Dashboard or API

-- Default password for all accounts: Dinky2024! (will be changed on first login)

-- 1. Patron account
-- Email: patron@dinky.com
-- Role: patron

-- 2. Genel Müdür account
-- Email: genelmudur@dinky.com
-- Role: genel_mudur

-- 3. Muhasebeci account
-- Email: muhasebe@dinky.com
-- Role: muhasebeci

-- 4. Depocu account
-- Email: depo@dinky.com
-- Role: depocu

-- 5-9. Usta accounts
-- Email: usta1@dinky.com, usta2@dinky.com, usta3@dinky.com, usta4@dinky.com, usta5@dinky.com
-- Role: usta

-- IMPORTANT: After running this migration, create users via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Create each user with the emails above
-- 4. Set password: Dinky2024!
-- 5. After users are created, run the update script below to link them to employees

-- Function to link users after creation
CREATE OR REPLACE FUNCTION link_user_to_employee()
RETURNS void AS $$
BEGIN
  -- Link patron
  UPDATE employees
  SET user_id = (SELECT id FROM auth.users WHERE email = 'patron@dinky.com' LIMIT 1)
  WHERE email = 'patron@dinky.com';

  -- Link genel müdür
  UPDATE employees
  SET user_id = (SELECT id FROM auth.users WHERE email = 'genelmudur@dinky.com' LIMIT 1)
  WHERE email = 'genelmudur@dinky.com';

  -- Link muhasebeci
  UPDATE employees
  SET user_id = (SELECT id FROM auth.users WHERE email = 'muhasebe@dinky.com' LIMIT 1)
  WHERE email = 'muhasebe@dinky.com';

  -- Link depocu
  UPDATE employees
  SET user_id = (SELECT id FROM auth.users WHERE email = 'depo@dinky.com' LIMIT 1)
  WHERE email = 'depo@dinky.com';

  -- Link ustalar
  UPDATE employees
  SET user_id = (SELECT id FROM auth.users WHERE email = 'usta1@dinky.com' LIMIT 1)
  WHERE email = 'usta1@dinky.com';

  UPDATE employees
  SET user_id = (SELECT id FROM auth.users WHERE email = 'usta2@dinky.com' LIMIT 1)
  WHERE email = 'usta2@dinky.com';

  UPDATE employees
  SET user_id = (SELECT id FROM auth.users WHERE email = 'usta3@dinky.com' LIMIT 1)
  WHERE email = 'usta3@dinky.com';

  UPDATE employees
  SET user_id = (SELECT id FROM auth.users WHERE email = 'usta4@dinky.com' LIMIT 1)
  WHERE email = 'usta4@dinky.com';

  UPDATE employees
  SET user_id = (SELECT id FROM auth.users WHERE email = 'usta5@dinky.com' LIMIT 1)
  WHERE email = 'usta5@dinky.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to see all users and their roles
CREATE OR REPLACE VIEW user_roles_view AS
SELECT
  e.id,
  e.full_name,
  e.email,
  e.role,
  e.position,
  e.department,
  e.is_active,
  u.id as auth_user_id,
  u.created_at as user_created_at
FROM employees e
LEFT JOIN auth.users u ON e.user_id = u.id
WHERE e.role IS NOT NULL
ORDER BY
  CASE e.role
    WHEN 'patron' THEN 1
    WHEN 'genel_mudur' THEN 2
    WHEN 'muhasebeci' THEN 3
    WHEN 'depocu' THEN 4
    WHEN 'usta' THEN 5
    ELSE 6
  END,
  e.full_name;

COMMENT ON VIEW user_roles_view IS 'View showing all users with their roles and auth status';
