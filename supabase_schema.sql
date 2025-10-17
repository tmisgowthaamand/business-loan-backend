-- Business Loan Management System Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('ADMIN', 'EMPLOYEE');
CREATE TYPE comment_status AS ENUM (
  'NO_RESPONSE',
  'CHAT_CALL1_COMPLETED', 
  'SECOND_CALL_COMPLETED',
  'THIRD_CALL_COMPLETED',
  'ELIGIBLE',
  'NOT_ELIGIBLE',
  'NO_GST'
);
CREATE TYPE interest_status AS ENUM ('INTERESTED', 'NOT_INTERESTED');
CREATE TYPE document_type AS ENUM (
  'GST',
  'UDYAM', 
  'BANK_STATEMENT',
  'OWNER_PAN',
  'AADHAR',
  'WEBSITE_GATEWAY',
  'IE_CODE'
);
CREATE TYPE cashfree_status AS ENUM ('PENDING', 'TRANSACTION_DONE', 'CLOSED');

-- Users table
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL,
  "passwordHash" VARCHAR(255),
  "inviteToken" VARCHAR(255),
  "tokenExpiry" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enquiries table
CREATE TABLE "Enquiry" (
  id SERIAL PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255),
  "businessName" VARCHAR(255),
  "ownerName" VARCHAR(255),
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  gst VARCHAR(255),
  "gstNumber" VARCHAR(255),
  "businessType" VARCHAR(255),
  "businessCategory" VARCHAR(255),
  "loanAmount" DECIMAL(15,2),
  "loanPurpose" TEXT,
  "monthlyTurnover" DECIMAL(15,2),
  "businessAge" INTEGER,
  address TEXT,
  "staffId" INTEGER REFERENCES "User"(id),
  comments comment_status,
  "interestStatus" interest_status,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE "Document" (
  id SERIAL PRIMARY KEY,
  "enquiryId" INTEGER NOT NULL REFERENCES "Enquiry"(id) ON DELETE CASCADE,
  "clientName" VARCHAR(255),
  type document_type NOT NULL,
  "s3Url" TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  "uploadedById" INTEGER NOT NULL REFERENCES "User"(id),
  "uploadedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Shortlist table
CREATE TABLE "Shortlist" (
  id SERIAL PRIMARY KEY,
  "enquiryId" INTEGER UNIQUE NOT NULL REFERENCES "Enquiry"(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  "businessName" VARCHAR(255),
  "businessNature" VARCHAR(255),
  district VARCHAR(255),
  "propPvt" VARCHAR(255),
  gst VARCHAR(255),
  "businessPan" VARCHAR(255),
  iec VARCHAR(255),
  "newCurrentAccount" BOOLEAN,
  website VARCHAR(255),
  gateway VARCHAR(255),
  transaction VARCHAR(255),
  "bankStatementDuration" VARCHAR(255),
  "loanAmount" DECIMAL(15,2),
  cap DECIMAL(15,2),
  "bankAccount" VARCHAR(255),
  comments TEXT,
  "staffId" INTEGER REFERENCES "User"(id),
  "gstStatus" VARCHAR(255),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Cashfree Applications table
CREATE TABLE "CashfreeApplication" (
  id SERIAL PRIMARY KEY,
  "shortlistId" INTEGER UNIQUE NOT NULL REFERENCES "Shortlist"(id) ON DELETE CASCADE,
  status cashfree_status NOT NULL,
  "submittedById" INTEGER NOT NULL REFERENCES "User"(id),
  "submittedAt" TIMESTAMPTZ DEFAULT NOW(),
  "decisionDate" TIMESTAMPTZ
);

-- Audit Log table
CREATE TABLE "AuditLog" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"(id),
  action VARCHAR(255) NOT NULL,
  "targetTable" VARCHAR(255) NOT NULL,
  "targetId" INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample admin user
INSERT INTO "User" (name, email, role, "createdAt") VALUES 
('Admin User', 'admin@businessloan.com', 'ADMIN', NOW()),
('Demo Employee', 'employee@businessloan.com', 'EMPLOYEE', NOW());

-- Insert sample enquiries
INSERT INTO "Enquiry" (name, "businessName", "ownerName", mobile, email, "businessType", comments, "interestStatus", "staffId", "createdAt") VALUES
('Rajesh Enterprises', 'Rajesh Enterprises', 'Rajesh Kumar', '9876543210', 'rajesh@rajeshenterprises.com', 'Textile Manufacturing', 'ELIGIBLE', 'INTERESTED', 1, NOW()),
('TechSoft Solutions', 'TechSoft Solutions', 'Priya Sharma', '9123456789', 'priya@techsoft.com', 'IT Services', 'ELIGIBLE', 'INTERESTED', 1, NOW()),
('Mumbai Food Distributors', 'Mumbai Food Distributors', 'Arjun Singh', '9234567890', 'arjun@mumbaifood.com', 'Food Trading', 'ELIGIBLE', 'INTERESTED', 1, NOW()),
('Green Energy Solutions', 'Green Energy Solutions', 'Kavita Joshi', '9345678901', 'kavita@greenenergy.com', 'Renewable Energy', 'ELIGIBLE', 'INTERESTED', 1, NOW()),
('Coastal Logistics Pvt Ltd', 'Coastal Logistics Pvt Ltd', 'Deepak Nair', '9456789012', 'deepak@coastallogistics.com', 'Transportation', 'ELIGIBLE', 'INTERESTED', 1, NOW()),
('Sathiskumar Aluminium Works', 'Sathiskumar Aluminium Works', 'Sathiskumar', '9629293598', 'sathiskumar58209@gmail.com', 'ALUMINIUM WORKS', 'ELIGIBLE', 'INTERESTED', 1, NOW());

-- Create storage bucket for documents (this needs to be done via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Enable Row Level Security (RLS)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shortlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashfreeApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (for now, allow all operations)
CREATE POLICY "Allow all operations for authenticated users" ON "User" FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON "Enquiry" FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON "Document" FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON "Shortlist" FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON "CashfreeApplication" FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON "AuditLog" FOR ALL USING (true);
