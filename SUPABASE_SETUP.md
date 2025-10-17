# Supabase Setup Guide

## Prerequisites

1. Supabase account created
2. Project created: "Business Loan"
3. Project URL: `https://vxtpjsymbcirszksrafg.supabase.co`

## Environment Configuration

Your `.env` file has been configured with:

```env
SUPABASE_URL=https://vxtpjsymbcirszksrafg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Setup

### Step 1: Get Database Password

1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Copy the database password
4. Update the `DATABASE_URL` in your `.env` file:

```env
DATABASE_URL="postgresql://postgres.vxtpjsymbcirszksrafg:[YOUR_DB_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
```

### Step 2: Run Database Migration

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to Supabase
npx prisma db push

# Or run migrations
npm run prisma:migrate
```

### Step 3: Enable Row Level Security (RLS)

In Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shortlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashfreeApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Create policies as needed for your application
```

## Features Enabled

✅ **Supabase Client**: Integrated `@supabase/supabase-js`
✅ **Environment Variables**: Configured with your project credentials
✅ **NestJS Service**: Created `SupabaseService` for database operations
✅ **Prisma Integration**: Updated to use Supabase PostgreSQL
✅ **Module Integration**: Added `SupabaseModule` to app

## Next Steps

1. Update `DATABASE_URL` with your actual database password
2. Run database migrations
3. Test the connection
4. Configure Row Level Security policies
5. Update frontend to use Supabase client
