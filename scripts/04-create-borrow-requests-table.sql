-- Create borrow requests table
CREATE TABLE IF NOT EXISTS borrow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  sub_department_id UUID REFERENCES sub_departments(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'borrowed', 'returned')),
  purpose TEXT,
  borrow_date TIMESTAMP,
  expected_return_date TIMESTAMP,
  actual_return_date TIMESTAMP,
  return_condition VARCHAR(50) CHECK (return_condition IN ('good', 'fair', 'damaged')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_borrow_requests_user_id ON borrow_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_item_id ON borrow_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_department_id ON borrow_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON borrow_requests(status);
