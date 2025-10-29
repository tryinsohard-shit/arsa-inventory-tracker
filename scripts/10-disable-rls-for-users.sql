-- Disable RLS (Row Level Security) for users table
-- This allows the application to insert/update/delete users directly

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users (if using Supabase auth)
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

