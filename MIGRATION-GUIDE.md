# 🔄 Migration Guide - Setup Users di Supabase

## ⚠️ Masalah

Login gagal karena user dan password masih di mock data lokal, belum masuk ke database Supabase.

## ✅ Solusi

### Step 1: Jalankan SQL Script di Supabase

1. Buka **Supabase Dashboard**: https://app.supabase.com
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy dan jalankan script berikut:

```sql
-- File: scripts/08-seed-users-with-passwords.sql
```

Script ini akan:

-   ✅ Insert 3 user (admin + 2 staff) ke database
-   ✅ Set password hash untuk semua user
-   ✅ Link user dengan department & sub-department

### Step 2: Verify Users Berhasil Dibuat

Jalankan query ini di SQL Editor untuk cek:

```sql
SELECT
    email,
    name,
    role,
    is_active,
    password_hash
FROM users;
```

Harusnya muncul 3 users:

-   adminarsa@clientname.com (admin)
-   staff1@clientname.com (staff)
-   staff2@clientname.com (staff)

### Step 3: Restart Development Server

```bash
# Stop server (Ctrl+C)
# Lalu jalankan ulang:
npm run dev
```

### Step 4: Login

Buka http://localhost:3000 dan login dengan:

**Admin:**

-   Email: `adminarsa@clientname.com`
-   Password: `password`

**Staff 1:**

-   Email: `staff1@clientname.com`
-   Password: `password`

**Staff 2:**

-   Email: `staff2@clientname.com`
-   Password: `password`

---

## 🔍 Cara Kerja Sekarang

### Sebelum Update:

```
Login → Cek Mock Data → Gagal (password tidak ada)
```

### Setelah Update:

```
Login → Load dari Supabase → Cek password → Success ✅
```

Kode sudah diupdate di:

1. **`lib/data-store.ts`** - Tambah `loadUsersFromSupabase()`
2. **`components/auth-provider.tsx`** - Load users dari Supabase saat login

---

## 📝 Note Penting

### Password Hash

Password "password" di-hash menjadi: `5f4dcc3b5aa765d61d8327deb882cf99`

⚠️ **PENTING untuk Production:**

-   Hash ini menggunakan algoritma sederhana
-   Untuk production, HARUS ganti ke bcrypt atau Argon2
-   Install: `npm install bcrypt`

### Fallback ke Mock Data

Jika Supabase error/tidak tersedia:

-   Sistem otomatis fallback ke mock data
-   User mock data sudah punya password hash
-   Login tetap bisa berfungsi

---

## 🐛 Troubleshooting

### Login masih gagal?

1. ✅ Cek apakah SQL script sudah dijalankan
2. ✅ Verify users ada di table `users`
3. ✅ Cek console browser untuk error
4. ✅ Pastikan .env.local credentials benar

### Error "password_hash is null"?

Jalankan ulang script 08-seed-users-with-passwords.sql

### Error di console "Error loading users from Supabase"?

-   Cek Supabase credentials di .env.local
-   Pastikan table `users` sudah dibuat (script 01-create-users-table.sql)
-   Cek internet connection

---

## 🚀 Next Steps

Setelah login berhasil, Anda bisa:

1. **Tambah User Baru** (via Admin dashboard)
2. **Setup Departments** (via Admin → Departments)
3. **Manage Inventory** (via Admin → Inventory)
4. **Test Borrow Requests** (via Staff user)

---

**Happy Testing! 🎉**
