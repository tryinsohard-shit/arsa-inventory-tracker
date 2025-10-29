# Fix UUID Error - Departments from Supabase

## Problem Fixed

Error `"invalid input syntax for type uuid"` terjadi karena:

1. Department ID dari mock data (`dept-1`, `dept-2`) bukan UUID
2. User ID temporary (`user-1761750063535`) bukan UUID
3. Supabase expect UUID untuk foreign keys

## Root Cause

```
Mock Data Department ID: "dept-1" ❌
Supabase Department ID: "812de562-bda1-4445-b75f-2f711cd5ae0a" ✅ (UUID)

Temporary User ID: "user-1761750063535" ❌
Supabase User ID: "1f082aba-dc92-42a4-9654-50c1c74f2251" ✅ (UUID)
```

## Solution Implemented

### 1. Load Departments from Supabase

**File: `components/user-management.tsx`**

Changed from:

```typescript
const departments = dataStore.getDepartments(); // Returns mock data
```

To:

```typescript
const { departments, subDepartments } = useDepartments(); // Loads from Supabase
```

This ensures:

-   ✅ Department IDs are actual UUIDs from Supabase
-   ✅ Sub-department IDs are actual UUIDs
-   ✅ Foreign key constraints work properly

### 2. Check User ID Before Setting Password

Added validation to only set password if user creation in Supabase succeeded:

```typescript
const newUser = await addUser({...})

// Only set password if user was created successfully (has UUID, not temporary ID)
if (newUser && !newUser.id.startsWith("user-")) {
  await dataStore.setUserPassword(newUser.id, formData.password)
}
```

This prevents trying to update password for temporary user IDs.

### 3. Fixed TypeScript Types

Updated formData state type to allow all user roles:

```typescript
const [formData, setFormData] = useState<{
  email: string
  name: string
  role: "admin" | "manager" | "staff" | "viewer"
  departmentId: string
  subDepartmentId: string
  password: string
}>({...})
```

## Testing

### Before Fix:

```
1. Add User with Department "IT"
   ❌ Error: invalid input syntax for type uuid: "dept-1"

2. User created with temporary ID
   ❌ Error: invalid input syntax for type uuid: "user-1761750063535"
```

### After Fix:

```
1. Departments loaded from Supabase with UUID
   ✅ Department ID: "812de562-bda1-4445-b75f-2f711cd5ae0a"

2. Add User
   ✅ User created in Supabase with UUID
   ✅ Password set successfully

3. User persists after reload
   ✅ Can login with new credentials
```

## Important Notes

-   **Must run script `05-seed-departments.sql` first** to have departments in Supabase
-   Departments are loaded on component mount via `useDepartments()` hook
-   `useDepartments()` calls `dataStore.loadDepartmentsFromSupabase()`
-   Password only set if user ID is UUID (not temporary)

## Files Modified

1. `components/user-management.tsx`
    - Import and use `useDepartments()` hook
    - Load departments from Supabase instead of mock data
    - Add UUID validation before setting password
    - Fix TypeScript types

## Related Files

-   `hooks/use-departments.ts` - Loads departments from Supabase
-   `lib/data-store.ts` - `loadDepartmentsFromSupabase()` method
-   `scripts/05-seed-departments.sql` - Seeds departments to Supabase

---

**Now user creation works with proper UUIDs from Supabase!** ✅
