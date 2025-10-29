# Fix Manager Permissions - Role-Based Access Control

## Problem

Department Manager bisa lihat dan manage **semua user** di department mereka, termasuk:

-   ❌ Admin (god mode)
-   ❌ Manager lain

Ini security issue - Manager seharusnya hanya manage **staff dan viewer** saja.

## Security Risk

```
Before Fix:
Manager login → Lihat semua users:
  - Admin ❌ (seharusnya tidak boleh)
  - Manager lain ❌ (seharusnya tidak boleh)
  - Staff ✅
  - Viewer ✅
```

## Solution Implemented

### File: `components/department-user-management.tsx`

#### 1. Filter Users by Role

Added role filter to exclude admin and manager:

```typescript
// Before ❌
const departmentUsers = users.filter((u) => u.departmentId === currentUser.departmentId);

// After ✅
const departmentUsers = users.filter((u) => u.departmentId === currentUser.departmentId && u.role !== 'admin' && u.role !== 'manager');
```

#### 2. Restrict Role Options

Role dropdown already restricted to staff and viewer only:

```typescript
<SelectContent>
    <SelectItem value="staff">Staff</SelectItem>
    <SelectItem value="viewer">Viewer</SelectItem>
    {/* NO admin or manager options */}
</SelectContent>
```

#### 3. TypeScript Type Safety

Updated formData type to only allow staff/viewer:

```typescript
const [formData, setFormData] = useState<{
    email: string;
    name: string;
    role: 'staff' | 'viewer'; // NOT "admin" | "manager"
    subDepartmentId: string;
}>({
    email: '',
    name: '',
    role: 'staff',
    subDepartmentId: '',
});
```

## Access Control Matrix

| Role    | Can View         | Can Create     | Can Edit       | Can Delete     |
| ------- | ---------------- | -------------- | -------------- | -------------- |
| Admin   | All users        | All roles      | All users      | All users      |
| Manager | Staff + Viewer   | Staff + Viewer | Staff + Viewer | Staff + Viewer |
| Staff   | Self only        | Cannot create  | Self only      | Cannot delete  |
| Viewer  | Read-only access | Cannot create  | Self only      | Cannot delete  |

## Testing

### Test 1: Manager Cannot See Admin

1. Create admin user di department IT
2. Create manager user di department IT
3. Login as manager
4. Go to "Department Users"
5. ✅ Admin user **tidak muncul** di list
6. ✅ Hanya staff/viewer yang terlihat

### Test 2: Manager Cannot Create Admin/Manager

1. Login as manager
2. Click "Add User"
3. Role dropdown:
    - ✅ Staff (available)
    - ✅ Viewer (available)
    - ❌ Admin (NOT available)
    - ❌ Manager (NOT available)

### Test 3: Manager Can Only Manage Their Department

1. Create users di department IT dan Finance
2. Login as IT manager
3. ✅ Only see IT department staff/viewers
4. ❌ Cannot see Finance users
5. ❌ Cannot see admins from any department

## Files Modified

-   `components/department-user-management.tsx`
    -   Added role filter (exclude admin/manager)
    -   Updated TypeScript types
    -   Role dropdown already correct (staff/viewer only)

## Related Security

This works together with:

-   `components/user-management.tsx` - Admin only, full access
-   `app/page.tsx` - Route protection by role
-   Backend should also validate (for production)

## Production Recommendations

For production, add backend validation:

1. **API Route Protection**

    ```typescript
    // Only allow managers to create staff/viewer
    if (currentUser.role === 'manager' && (newUser.role === 'admin' || newUser.role === 'manager')) {
        throw new Error('Forbidden');
    }
    ```

2. **Database RLS Policies**
    ```sql
    CREATE POLICY "Managers can only manage staff/viewer" ON users
      FOR ALL
      USING (
        auth.user().role = 'manager' AND
        role IN ('staff', 'viewer') AND
        department_id = auth.user().department_id
      );
    ```

---

**Now managers have proper access control!** ✅ No more god-mode access.
