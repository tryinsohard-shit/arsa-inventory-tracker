# 🚀 Setup Guide - ARSA Inventory Tracker

## 📋 Prerequisites

-   Node.js v18+ (Currently using: v22.21.0)
-   NPM atau PNPM
-   Supabase Account & Project

## 🔧 Installation Steps

### 1. Install Dependencies

```bash
npm install
# atau
pnpm install
```

### 2. Environment Variables Setup

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Cara mendapatkan Supabase credentials:**

1. Buka [https://app.supabase.com](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Settings** → **API**
4. Copy:
    - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
    - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Database Setup

Jalankan SQL scripts berikut di **Supabase SQL Editor** secara berurutan:

```
scripts/01-create-users-table.sql
scripts/02-create-departments-table.sql
scripts/03-create-inventory-table.sql
scripts/04-create-borrow-requests-table.sql
scripts/05-seed-departments.sql
scripts/06-update-users-table.sql
scripts/07-add-passwords-table.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

## 👤 Demo Accounts

Gunakan credentials berikut untuk login:

### Admin Account:

-   **Email:** `adminarsa@clientname.com`
-   **Password:** `password`

### Staff Account 1:

-   **Email:** `staff1@clientname.com`
-   **Password:** `password`

### Staff Account 2:

-   **Email:** `staff2@clientname.com`
-   **Password:** `password`

## 📱 Features

-   ✅ User Management (Admin, Manager, Staff, Viewer roles)
-   ✅ Department & Sub-Department Management
-   ✅ Inventory Item Management
-   ✅ Borrow Request System
-   ✅ Dashboard & Analytics
-   ✅ Reports Generation
-   ✅ Audit Logging

## 🛠️ Tech Stack

-   **Framework:** Next.js 15.2.4 (React 19)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS v4
-   **UI Components:** Radix UI
-   **Database:** Supabase (PostgreSQL)
-   **Icons:** Lucide React

## 📂 Project Structure

```
arsa-inventory-tracker/
├── app/                    # Next.js App Router
├── components/             # React Components
│   ├── ui/                # Reusable UI components
│   └── ...                # Feature components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & data store
├── public/                # Static assets
├── scripts/               # Database migration scripts
└── styles/                # Global styles
```

## 🔐 Security Notes

⚠️ **PENTING:** Password hash yang digunakan saat ini adalah implementasi sederhana untuk development.

Untuk **production**, ganti dengan bcrypt atau library hashing yang lebih aman:

```bash
npm install bcrypt
```

## 🚀 Production Build

```bash
# Build untuk production
npm run build

# Start production server
npm start
```

## 📝 Notes

-   Database sudah include seed data untuk departments
-   Mock data tersedia untuk testing tanpa Supabase
-   Aplikasi support role-based access control (RBAC)
-   Fitur department management terintegrasi dengan Supabase

## 🆘 Troubleshooting

### Server tidak bisa start?

-   Pastikan port 3000 tidak digunakan aplikasi lain
-   Cek apakah `.env.local` sudah dibuat dengan benar

### Login gagal?

-   Pastikan menggunakan password: `password`
-   Clear browser cache & localStorage
-   Cek console browser untuk error

### Supabase error?

-   Verifikasi credentials di `.env.local`
-   Pastikan semua SQL scripts sudah dijalankan
-   Cek Supabase project status

## 📧 Support

Jika ada pertanyaan atau issue, silakan buat issue di repository atau hubungi tim development.

---

**Happy Coding! 🎉**
