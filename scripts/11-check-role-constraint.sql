-- Check what role values are allowed in users table

-- Check constraint definition
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'users' 
  AND con.contype = 'c';

-- Show sample data to see what roles exist
SELECT DISTINCT role FROM users;

