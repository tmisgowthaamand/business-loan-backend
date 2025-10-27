-- Business Loan Management System - Supabase Database Schema
-- Date: 25/10/2025 6:00 PM Restoration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS shortlists CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS enquiries CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (for authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff table
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
    department VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    has_access BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    client_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enquiries table
CREATE TABLE enquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    loan_amount DECIMAL(15,2),
    source VARCHAR(50) DEFAULT 'ONLINE_APPLICATION',
    interest_status VARCHAR(50) DEFAULT 'INTERESTED',
    staff_id INTEGER REFERENCES staff(id),
    assigned_staff VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    enquiry_id INTEGER REFERENCES enquiries(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES staff(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shortlists table
CREATE TABLE shortlists (
    id SERIAL PRIMARY KEY,
    enquiry_id INTEGER REFERENCES enquiries(id),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    business_constitution VARCHAR(100),
    loan_amount DECIMAL(15,2),
    cap_amount DECIMAL(15,2),
    district VARCHAR(100),
    gst_status VARCHAR(50),
    bank_account VARCHAR(100),
    statement_duration VARCHAR(50),
    staff VARCHAR(255),
    interest_status VARCHAR(50) DEFAULT 'INTERESTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    shortlist_id INTEGER REFERENCES shortlists(id),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    loan_amount DECIMAL(15,2),
    tenure INTEGER,
    interest_rate DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_gateway VARCHAR(50) DEFAULT 'CASHFREE',
    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payments(id),
    transaction_id VARCHAR(255) UNIQUE,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    gateway VARCHAR(50) DEFAULT 'CASHFREE',
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_enquiries_mobile ON enquiries(mobile);
CREATE INDEX idx_enquiries_staff_id ON enquiries(staff_id);
CREATE INDEX idx_enquiries_created_at ON enquiries(created_at);
CREATE INDEX idx_documents_enquiry_id ON documents(enquiry_id);
CREATE INDEX idx_documents_verified ON documents(verified);
CREATE INDEX idx_shortlists_enquiry_id ON shortlists(enquiry_id);
CREATE INDEX idx_payments_shortlist_id ON payments(shortlist_id);
CREATE INDEX idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_users_email ON users(email);

-- Insert seed data (25/10/2025 6:00 PM state)

-- Insert staff members
INSERT INTO staff (name, email, password_hash, role, department, phone, status, has_access, verified, client_name) VALUES
('Perivi', 'gowthaamankrishna1998@gmail.com', '$2b$10$example.hash.here', 'ADMIN', 'Management', '9876543210', 'ACTIVE', TRUE, TRUE, 'Rajesh Kumar, Priya Sharma, Amit Patel'),
('Venkat', 'gowthaamaneswar1998@gmail.com', '$2b$10$example.hash.here', 'EMPLOYEE', 'Operations', '9876543211', 'ACTIVE', TRUE, TRUE, 'Sunita Gupta, Vikram Singh'),
('Harish', 'newacttmis@gmail.com', '$2b$10$example.hash.here', 'ADMIN', 'Client Management', '9876543212', 'ACTIVE', TRUE, TRUE, 'Anita Desai, Ravi Mehta, Sanjay Joshi'),
('Dinesh', 'dinesh@gmail.com', '$2b$10$example.hash.here', 'EMPLOYEE', 'Processing', '9876543213', 'ACTIVE', TRUE, TRUE, 'Available for Assignment - Ready for New Clients'),
('Nunciya', 'tmsnunciya59@gmail.com', '$2b$10$example.hash.here', 'ADMIN', 'Administration', '9876543214', 'ACTIVE', TRUE, TRUE, 'Deepak Verma'),
('Admin User', 'admin@businessloan.com', '$2b$10$example.hash.here', 'ADMIN', 'Administration', '9876543215', 'ACTIVE', TRUE, TRUE, 'Neha Agarwal, Rohit Sharma'),
('Admin User', 'admin@gmail.com', '$2b$10$example.hash.here', 'ADMIN', 'Administration', '9876543216', 'ACTIVE', TRUE, TRUE, 'Manish Gupta');

-- Insert enquiries
INSERT INTO enquiries (name, mobile, email, business_name, business_type, loan_amount, source, interest_status, assigned_staff) VALUES
('BALAMURUGAN', '9876543210', 'balamurugan@example.com', 'Bala Manufacturing', 'Manufacturing', 500000, 'ONLINE_APPLICATION', 'INTERESTED', 'Perivi'),
('Rajesh Kumar', '9876543211', 'rajesh@example.com', 'Kumar Traders', 'Trading', 750000, 'ONLINE_APPLICATION', 'INTERESTED', 'Perivi'),
('Priya Sharma', '9876543212', 'priya@example.com', 'Sharma Enterprises', 'Services', 300000, 'ONLINE_APPLICATION', 'FOLLOW_UP_REQUIRED', 'Perivi'),
('Amit Patel', '9876543213', 'amit@example.com', 'Patel Industries', 'Manufacturing', 1000000, 'ONLINE_APPLICATION', 'INTERESTED', 'Perivi'),
('Sunita Gupta', '9876543214', 'sunita@example.com', 'Gupta Textiles', 'Textile', 600000, 'ONLINE_APPLICATION', 'INTERESTED', 'Venkat'),
('Vikram Singh', '9876543215', 'vikram@example.com', 'Singh Motors', 'Automotive', 800000, 'ONLINE_APPLICATION', 'INTERESTED', 'Venkat'),
('Anita Desai', '9876543216', 'anita@example.com', 'Desai Foods', 'Food Processing', 450000, 'ONLINE_APPLICATION', 'INTERESTED', 'Harish'),
('Ravi Mehta', '9876543217', 'ravi@example.com', 'Mehta Construction', 'Construction', 1200000, 'ONLINE_APPLICATION', 'INTERESTED', 'Harish'),
('Sanjay Joshi', '9876543218', 'sanjay@example.com', 'Joshi Electronics', 'Electronics', 350000, 'ONLINE_APPLICATION', 'INTERESTED', 'Harish'),
('Deepak Verma', '9876543219', 'deepak@example.com', 'Verma Logistics', 'Logistics', 900000, 'ONLINE_APPLICATION', 'INTERESTED', 'Nunciya'),
('Neha Agarwal', '9876543220', 'neha@example.com', 'Agarwal Pharma', 'Pharmaceutical', 700000, 'ONLINE_APPLICATION', 'INTERESTED', 'Admin User'),
('Rohit Sharma', '9876543221', 'rohit@example.com', 'Sharma IT Solutions', 'IT Services', 550000, 'ONLINE_APPLICATION', 'INTERESTED', 'Admin User'),
('Manish Gupta', '9876543222', 'manish@example.com', 'Gupta Exports', 'Export', 850000, 'ONLINE_APPLICATION', 'INTERESTED', 'Admin User');

-- Insert documents (some verified, some pending)
INSERT INTO documents (enquiry_id, document_type, file_name, verified, status) VALUES
(1, 'GST_CERTIFICATE', 'bala_gst.pdf', TRUE, 'VERIFIED'),
(1, 'UDYAM_REGISTRATION', 'bala_udyam.pdf', TRUE, 'VERIFIED'),
(1, 'BANK_STATEMENT', 'bala_bank.pdf', TRUE, 'VERIFIED'),
(1, 'OWNER_PAN', 'bala_pan.pdf', TRUE, 'VERIFIED'),
(1, 'AADHAR', 'bala_aadhar.pdf', TRUE, 'VERIFIED'),
(2, 'GST_CERTIFICATE', 'rajesh_gst.pdf', FALSE, 'PENDING'),
(3, 'BANK_STATEMENT', 'priya_bank.pdf', FALSE, 'PENDING'),
(4, 'UDYAM_REGISTRATION', 'amit_udyam.pdf', FALSE, 'PENDING'),
(5, 'GST_CERTIFICATE', 'sunita_gst.pdf', TRUE, 'VERIFIED'),
(6, 'BANK_STATEMENT', 'vikram_bank.pdf', TRUE, 'VERIFIED');

-- Insert shortlists
INSERT INTO shortlists (enquiry_id, name, mobile, business_name, business_type, loan_amount, cap_amount, district, staff, interest_status) VALUES
(1, 'BALAMURUGAN', '9876543210', 'Bala Manufacturing', 'Manufacturing', 500000, 450000, 'Chennai', 'Perivi', 'INTERESTED'),
(2, 'Rajesh Kumar', '9876543211', 'Kumar Traders', 'Trading', 750000, 700000, 'Mumbai', 'Perivi', 'INTERESTED'),
(5, 'Sunita Gupta', '9876543214', 'Gupta Textiles', 'Textile', 600000, 550000, 'Delhi', 'Venkat', 'INTERESTED'),
(7, 'Anita Desai', '9876543216', 'Desai Foods', 'Food Processing', 450000, 400000, 'Pune', 'Harish', 'INTERESTED'),
(10, 'Deepak Verma', '9876543219', 'Verma Logistics', 'Logistics', 900000, 850000, 'Bangalore', 'Nunciya', 'INTERESTED');

-- Insert payments
INSERT INTO payments (shortlist_id, name, mobile, business_name, business_type, loan_amount, tenure, interest_rate, status) VALUES
(1, 'BALAMURUGAN', '9876543210', 'Bala Manufacturing', 'Manufacturing', 500000, 36, 12.5, 'APPROVED'),
(2, 'Rajesh Kumar', '9876543211', 'Kumar Traders', 'Trading', 750000, 48, 13.0, 'PENDING'),
(3, 'Sunita Gupta', '9876543214', 'Gupta Textiles', 'Textile', 600000, 42, 12.8, 'PROCESSING'),
(4, 'Anita Desai', '9876543216', 'Desai Foods', 'Food Processing', 450000, 36, 12.3, 'APPROVED'),
(5, 'Deepak Verma', '9876543219', 'Verma Logistics', 'Logistics', 900000, 60, 13.5, 'PENDING');

-- Insert transactions
INSERT INTO transactions (payment_id, transaction_id, amount, status, gateway) VALUES
(1, 'TXN_BALA_001', 500000, 'COMPLETED', 'CASHFREE'),
(4, 'TXN_ANITA_001', 450000, 'COMPLETED', 'CASHFREE'),
(2, 'TXN_RAJESH_001', 750000, 'PENDING', 'CASHFREE'),
(3, 'TXN_SUNITA_001', 600000, 'PROCESSING', 'CASHFREE'),
(5, 'TXN_DEEPAK_001', 900000, 'PENDING', 'CASHFREE');

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON staff FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON enquiries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON shortlists FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON transactions FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for anonymous users (for public application form)
CREATE POLICY "Enable insert for anonymous users" ON enquiries FOR INSERT WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
ALTER PUBLICATION supabase_realtime ADD TABLE enquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE shortlists;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enquiries_updated_at BEFORE UPDATE ON enquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shortlists_updated_at BEFORE UPDATE ON shortlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
