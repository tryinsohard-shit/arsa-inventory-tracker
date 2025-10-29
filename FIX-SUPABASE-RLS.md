# Fix Supabase RLS Error

## Problem

Error `{}` ketika insert/update user ke Supabase karena Row Level Security (RLS) memblokir akses.

```
Error: [v0] Error adding user to Supabase: {}
Error: [v0] Error updating password: {}
```

## Root Cause

Supabase secara default mengaktifkan **Row Level Security (RLS)** pada semua tabel. Ini memblokir insert/update/delete dari client-side kecuali ada policy yang mengizinkan.

## Solution

### Quick Fix: Disable RLS

Jalankan SQL script di **Supabase SQL Editor**:

**File: `scripts/10-disable-rls-for-users.sql`**

```sql
-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;

-- Verify
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users';
```

Setelah run script:

-   `rowsecurity` = `false` ✅ (RLS disabled)

### Alternative: Enable RLS with Policy (More Secure)

Jika ingin tetap pakai RLS (lebih aman untuk production):

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- OR more specific policies:

-- Policy: Allow select for all
CREATE POLICY "Allow select for all" ON users
    FOR SELECT
    USING (true);

-- Policy: Allow insert for authenticated
CREATE POLICY "Allow insert for authenticated" ON users
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow update for authenticated
CREATE POLICY "Allow update for authenticated" ON users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Allow delete for authenticated
CREATE POLICY "Allow delete for authenticated" ON users
    FOR DELETE
    USING (true);
```

## Verification

### Check RLS Status:

```sql
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';
```

### Check Policies:

```sql
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';
```

## Testing After Fix

1. **Refresh browser** (clear cache)
2. **Add User** di admin panel
3. Cek console - tidak ada error lagi ✅
4. **Cek Supabase** - user muncul di table ✅
5. **Reset Password** - berhasil ✅
6. **Update User** - berhasil ✅

## Error Logging Improvement

Code sekarang menampilkan error lebih detail:

```typescript
console.error('[v0] Error details:', error.message || error);
```

Jika masih error setelah disable RLS, cek console untuk detail error yang lebih jelas.

## Security Notes

⚠️ **Development:**

-   Disable RLS OK untuk development
-   Fokus pada speed development

⚠️ **Production:**

-   HARUS pakai RLS dengan policies yang ketat
-   Atau gunakan Supabase Auth + Service Role Key
-   Jangan expose anon key di client-side untuk operasi CRUD

## Recommended for Production

1. Gunakan **Supabase Auth** untuk authentication
2. Buat **RLS Policies** berdasarkan user role
3. Atau pindahkan CRUD operations ke **API Routes/Server Actions**
4. Gunakan **Service Role Key** di backend, bukan anon key

---

**For now: Disable RLS dulu biar development bisa jalan!** 🚀
