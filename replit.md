# ARSA Inventory Tracker - Replit Configuration

## Project Overview
A Next.js 15 inventory management system with Supabase backend, featuring role-based access control, department management, and borrowing request tracking.

## Recent Changes

### Migration from Vercel to Replit (October 30, 2025)
Successfully migrated the project to run on Replit with the following changes:
- Configured Next.js to run on port 5000 with 0.0.0.0 host binding for Replit compatibility
- Set up Supabase environment variables through Replit Secrets
- Installed dependencies using npm with --legacy-peer-deps flag (React 19 compatibility)
- Configured deployment target as "autoscale" for production use
- Added defensive environment variable handling in Supabase client

## Environment Configuration

### Required Environment Variables
The project requires two Supabase credentials (stored in Replit Secrets):
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Development Environment
- Port: 5000
- Host: 0.0.0.0
- Package Manager: npm
- Node Version: 22.21.0

## Project Architecture

### Tech Stack
- Framework: Next.js 15.2.4 (App Router)
- React: v19
- TypeScript: v5
- Styling: Tailwind CSS v4
- UI Components: Radix UI
- Database: Supabase (PostgreSQL)
- Icons: Lucide React

### Directory Structure
```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components (Radix)
│   └── ...                # Feature-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and data management
│   ├── supabase-client.ts # Supabase configuration
│   ├── data-store.ts      # Data management layer
│   └── types.ts           # TypeScript type definitions
├── public/                # Static assets
├── scripts/               # Database migration SQL scripts
└── styles/                # Global CSS styles
```

### Key Features
- User Management (Admin, Manager, Staff, Viewer roles)
- Department & Sub-Department Management
- Inventory Item Tracking
- Borrow Request System
- Dashboard & Analytics
- Reports Generation
- Audit Logging

## Database Setup

The project uses Supabase as the backend database. SQL migration scripts are located in the `scripts/` directory and should be run in order:

1. 01-create-users-table.sql
2. 02-create-departments-table.sql
3. 03-create-inventory-table.sql
4. 04-create-borrow-requests-table.sql
5. 05-seed-departments.sql
6. 06-update-users-table.sql
7. 07-add-passwords-table.sql
8. 08-seed-users-with-passwords.sql
9. 09-fix-password-hashes.sql
10. 10-disable-rls-for-users.sql
11. 11-check-role-constraint.sql
12. 12-add-manager-role.sql

## Demo Accounts

### Admin
- Email: adminarsa@clientname.com
- Password: password

### Staff Accounts
- Email: staff1@clientname.com / staff2@clientname.com
- Password: password

## Deployment

The project is configured for deployment on Replit using:
- Deployment Target: Autoscale (for stateless web apps)
- Build Command: `npm run build`
- Start Command: `npm start`

## Development Notes

### Running the Project
```bash
npm run dev    # Development server on port 5000
npm run build  # Production build
npm start      # Production server on port 5000
```

### Important Security Notes
1. The current password hashing is simplified for development
2. For production, implement proper bcrypt-based password hashing
3. Ensure RLS (Row Level Security) policies are properly configured in Supabase
4. Never commit `.env.local` or expose API keys in code

### Known Issues
- A temporary workaround exists in `lib/supabase-client.ts` to handle swapped environment variables
- This should be removed once Replit Secrets are corrected

## User Preferences
None documented yet.
