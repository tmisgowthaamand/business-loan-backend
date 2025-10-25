-- Business Loan Management System - Complete Database Schema
-- Run this in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET row_security = on;

-- Create Enquiries table
CREATE TABLE IF NOT EXISTS public."Enquiry" (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    loan_amount DECIMAL(15,2),
    source VARCHAR(50) DEFAULT 'ONLINE_APPLICATION',
    interest_status VARCHAR(50) DEFAULT 'INTERESTED',
    staff_id INTEGER,
    assigned_staff VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Documents table
CREATE TABLE IF NOT EXISTS public."Document" (
    id BIGSERIAL PRIMARY KEY,
    enquiry_id BIGINT REFERENCES public."Enquiry"(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(255),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Shortlist table
CREATE TABLE IF NOT EXISTS public."Shortlist" (
    id BIGSERIAL PRIMARY KEY,
    enquiry_id BIGINT REFERENCES public."Enquiry"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    business_nature VARCHAR(100),
    business_constitution VARCHAR(100),
    loan_amount DECIMAL(15,2),
    cap_amount DECIMAL(15,2),
    district VARCHAR(100),
    gst_status VARCHAR(50),
    bank_account VARCHAR(100),
    statement_duration VARCHAR(50),
    staff VARCHAR(255),
    interest_status VARCHAR(50) DEFAULT 'INTERESTED',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Staff table
CREATE TABLE IF NOT EXISTS public."Staff" (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
    department VARCHAR(100),
    position VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    has_access BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    client_name TEXT,
    access_token VARCHAR(500),
    access_token_expiry TIMESTAMP WITH TIME ZONE,
    invite_token VARCHAR(500),
    token_expiry TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255) DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CashfreeApplication table
CREATE TABLE IF NOT EXISTS public."CashfreeApplication" (
    id BIGSERIAL PRIMARY KEY,
    shortlist_id BIGINT REFERENCES public."Shortlist"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    business_type VARCHAR(100),
    loan_amount DECIMAL(15,2) NOT NULL,
    tenure INTEGER NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    monthly_income DECIMAL(15,2),
    existing_loans DECIMAL(15,2),
    collateral_type VARCHAR(100),
    collateral_value DECIMAL(15,2),
    purpose VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    application_data JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS public."Notification" (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    user_id INTEGER DEFAULT 1,
    read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Transactions table
CREATE TABLE IF NOT EXISTS public."Transaction" (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enquiry_mobile ON public."Enquiry"(mobile);
CREATE INDEX IF NOT EXISTS idx_enquiry_created_at ON public."Enquiry"(created_at);
CREATE INDEX IF NOT EXISTS idx_document_enquiry_id ON public."Document"(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_document_type ON public."Document"(document_type);
CREATE INDEX IF NOT EXISTS idx_shortlist_enquiry_id ON public."Shortlist"(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON public."Staff"(email);
CREATE INDEX IF NOT EXISTS idx_cashfree_shortlist_id ON public."CashfreeApplication"(shortlist_id);
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON public."Notification"(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_read ON public."Notification"(read);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enquiry_updated_at BEFORE UPDATE ON public."Enquiry" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_updated_at BEFORE UPDATE ON public."Document" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shortlist_updated_at BEFORE UPDATE ON public."Shortlist" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public."Staff" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cashfree_updated_at BEFORE UPDATE ON public."CashfreeApplication" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_updated_at BEFORE UPDATE ON public."Notification" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transaction_updated_at BEFORE UPDATE ON public."Transaction" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public."Enquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Shortlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CashfreeApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
CREATE POLICY "Enable all operations for all users" ON public."Enquiry" FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public."Document" FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public."Shortlist" FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public."Staff" FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public."CashfreeApplication" FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public."Notification" FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public."Transaction" FOR ALL USING (true);

-- Create Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for documents bucket
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'documents');

-- Insert sample data for testing
INSERT INTO public."Staff" (name, email, password_hash, role, department, position, verified, client_name) VALUES
('Perivi', 'gowthaamankrishna1998@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'Management', 'Administrator', true, 'Rajesh Kumar, Priya Sharma, Amit Patel'),
('Venkat', 'gowthaamaneswar1998@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'EMPLOYEE', 'Operations', 'Employee', true, 'Sunita Gupta, Vikram Singh'),
('Harish', 'newacttmis@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'Client Management', 'Manager', true, 'Anita Desai, Ravi Mehta, Sanjay Joshi'),
('Dinesh', 'dinesh@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'EMPLOYEE', 'Processing', 'Employee', true, 'Available for Assignment - Ready for New Clients'),
('Nunciya', 'tmsnunciya59@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'Administration', 'Administrator', true, 'Deepak Verma'),
('Admin User', 'admin@businessloan.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'Administration', 'Business Administrator', true, 'Neha Agarwal, Rohit Sharma'),
('Admin User', 'admin@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'Administration', 'System Administrator', true, 'Manish Gupta')
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Database schema created successfully! All tables, indexes, triggers, and policies are ready.' as status;
