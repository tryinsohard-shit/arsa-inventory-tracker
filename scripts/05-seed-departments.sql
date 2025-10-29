-- Seed departments and sub-departments
INSERT INTO departments (name, description) VALUES
  ('IT', 'Information Technology Department'),
  ('Operations', 'Operations Department'),
  ('HR', 'Human Resources Department'),
  ('Finance', 'Finance Department')
ON CONFLICT (name) DO NOTHING;

-- Get department IDs for sub-departments
INSERT INTO sub_departments (department_id, name, description) 
SELECT d.id, 'Infrastructure', 'IT Infrastructure Team' FROM departments d WHERE d.name = 'IT'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO sub_departments (department_id, name, description) 
SELECT d.id, 'Support', 'IT Support Team' FROM departments d WHERE d.name = 'IT'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO sub_departments (department_id, name, description) 
SELECT d.id, 'Logistics', 'Operations Logistics' FROM departments d WHERE d.name = 'Operations'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO sub_departments (department_id, name, description) 
SELECT d.id, 'Warehouse', 'Warehouse Management' FROM departments d WHERE d.name = 'Operations'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO sub_departments (department_id, name, description) 
SELECT d.id, 'Recruitment', 'Recruitment Team' FROM departments d WHERE d.name = 'HR'
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO sub_departments (department_id, name, description) 
SELECT d.id, 'Accounting', 'Accounting Team' FROM departments d WHERE d.name = 'Finance'
ON CONFLICT (department_id, name) DO NOTHING;
