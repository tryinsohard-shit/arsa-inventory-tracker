-- Fix password hashes to match the hashPassword function
-- Password: "password" 
-- Correct hash from our function: 4889ba9b

UPDATE users 
SET password_hash = '4889ba9b'
WHERE email IN (
    'adminarsa@clientname.com',
    'staff1@clientname.com', 
    'staff2@clientname.com'
);

-- Verify the update
SELECT email, name, role, password_hash FROM users;

