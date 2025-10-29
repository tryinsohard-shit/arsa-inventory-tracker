-- Add 'manager' role to users table constraint

-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with manager role
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'manager', 'staff', 'viewer'));

-- Verify constraint
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'users' 
  AND con.contype = 'c'
  AND con.conname = 'users_role_check';

