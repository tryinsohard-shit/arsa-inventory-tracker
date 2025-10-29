-- Seed users with password hashes
-- Password for all users: "password"
-- Hash: 5f4dcc3b5aa765d61d8327deb882cf99

-- Get department IDs
DO $$
DECLARE
    dept_it_id UUID;
    dept_ops_id UUID;
    dept_fin_id UUID;
    subdept_infra_id UUID;
    subdept_logistics_id UUID;
    subdept_accounting_id UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO dept_it_id FROM departments WHERE name = 'IT' LIMIT 1;
    SELECT id INTO dept_ops_id FROM departments WHERE name = 'Operations' LIMIT 1;
    SELECT id INTO dept_fin_id FROM departments WHERE name = 'Finance' LIMIT 1;
    
    -- Get sub-department IDs
    SELECT id INTO subdept_infra_id FROM sub_departments WHERE name = 'Infrastructure' AND department_id = dept_it_id LIMIT 1;
    SELECT id INTO subdept_logistics_id FROM sub_departments WHERE name = 'Logistics' AND department_id = dept_ops_id LIMIT 1;
    SELECT id INTO subdept_accounting_id FROM sub_departments WHERE name = 'Accounting' AND department_id = dept_fin_id LIMIT 1;

    -- Insert Admin User
    INSERT INTO users (email, name, role, department_id, sub_department_id, password_hash, is_active)
    VALUES (
        'adminarsa@clientname.com',
        'Administrator',
        'admin',
        dept_it_id,
        subdept_infra_id,
        '5f4dcc3b5aa765d61d8327deb882cf99',
        true
    )
    ON CONFLICT (email) DO UPDATE 
    SET password_hash = '5f4dcc3b5aa765d61d8327deb882cf99';

    -- Insert Staff 1
    INSERT INTO users (email, name, role, department_id, sub_department_id, password_hash, is_active)
    VALUES (
        'staff1@clientname.com',
        'Staff Member 1',
        'staff',
        dept_ops_id,
        subdept_logistics_id,
        '5f4dcc3b5aa765d61d8327deb882cf99',
        true
    )
    ON CONFLICT (email) DO UPDATE 
    SET password_hash = '5f4dcc3b5aa765d61d8327deb882cf99';

    -- Insert Staff 2
    INSERT INTO users (email, name, role, department_id, sub_department_id, password_hash, is_active)
    VALUES (
        'staff2@clientname.com',
        'Staff Member 2',
        'staff',
        dept_fin_id,
        subdept_accounting_id,
        '5f4dcc3b5aa765d61d8327deb882cf99',
        true
    )
    ON CONFLICT (email) DO UPDATE 
    SET password_hash = '5f4dcc3b5aa765d61d8327deb882cf99';
END $$;

-- Verify users were created
SELECT email, name, role, is_active FROM users;

