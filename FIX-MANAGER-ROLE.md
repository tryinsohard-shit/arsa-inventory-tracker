# Fix Manager Role Constraint

## Problem

Error: `"new row for relation \"users\" violates check constraint \"users_role_check\""`

## Root Cause

Database constraint hanya allow 3 roles:

```sql
CHECK (role IN ('admin', 'staff', 'viewer'))
```

Tapi aplikasi punya 4 roles:

```typescript
role: 'admin' | 'manager' | 'staff' | 'viewer';
```

**Missing:** `'manager'` role di database constraint! ❌

## Solution

Update constraint di Supabase untuk include role `'manager'`.

### Run SQL Script

**File: `scripts/12-add-manager-role.sql`**

```sql
-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with manager role
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'manager', 'staff', 'viewer'));
```

## Verification

After running the script, verify constraint:

```sql
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'users'
  AND con.contype = 'c'
  AND con.conname = 'users_role_check';
```

Should return:

```
constraint_name: users_role_check
constraint_definition: CHECK ((role)::text = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text, 'viewer'::text]))
```

## Testing

1. **Run script** `12-add-manager-role.sql` in Supabase SQL Editor
2. **Refresh browser**
3. **Add User** with any role (admin/manager/staff/viewer)
4. ✅ **No error!**
5. ✅ **User created successfully**

## Roles Explained

-   **admin**: Full access, manage all users, departments, inventory, reports
-   **manager**: Manage users in their department only
-   **staff**: Create borrow requests, view inventory
-   **viewer**: Read-only access

## Files Created

1. `scripts/11-check-role-constraint.sql` - Query to check constraint
2. `scripts/12-add-manager-role.sql` - Fix to add manager role

## Related Files

-   `scripts/01-create-users-table.sql` - Original table creation (missing manager)
-   `lib/types.ts` - User type definition with all 4 roles
-   `components/user-management.tsx` - UI for all 4 roles

---

**After running this script, all 4 roles will work!** ✅
