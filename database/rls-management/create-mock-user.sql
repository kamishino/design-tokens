-- =====================================================
-- RLS Management: Create Mock User (Alternative Approach)
-- =====================================================
-- Purpose: Create mock user in auth system to satisfy RLS policies
-- Usage: Alternative to disabling RLS - creates a real auth user
-- =====================================================

-- Insert the mock user into auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  phone_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change,
  phone_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Mock UUID (matches DEV_MOCK_USER_ID)
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dev@example.com',
  '', -- Empty password for dev
  now(),
  null,
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dev Admin","role":"admin"}',
  true,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = now(),
  last_sign_in_at = now();

-- Verify mock user creation
SELECT 
  id,
  email,
  role,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- =====================================================
-- Result: Mock user exists in auth system
-- RLS policies will now recognize this user
-- =====================================================
