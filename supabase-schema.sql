-- Supabase Enquiry Table Schema
-- Run this in your Supabase SQL Editor

-- Create enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    business_type VARCHAR(100),
    loan_amount DECIMAL(15,2),
    source VARCHAR(50) DEFAULT 'ONLINE_APPLICATION',
    interest_status VARCHAR(50) DEFAULT 'INTERESTED',
    staff_id INTEGER,
    assigned_staff VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_enquiries_mobile ON enquiries(mobile);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_enquiries_staff_id ON enquiries(staff_id);

-- Enable Row Level Security (RLS)
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON enquiries
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow insert for anonymous users (for public form)
CREATE POLICY "Allow insert for anonymous users" ON enquiries
    FOR INSERT WITH CHECK (true);

-- Create policy to allow select for anonymous users (for public queries)
CREATE POLICY "Allow select for anonymous users" ON enquiries
    FOR SELECT USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enquiries_updated_at 
    BEFORE UPDATE ON enquiries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    enquiry_id INTEGER NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING',
    verified_by INTEGER,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shortlist table
CREATE TABLE IF NOT EXISTS shortlist (
    id SERIAL PRIMARY KEY,
    enquiry_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(255),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    loan_amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_gateways table
CREATE TABLE IF NOT EXISTS payment_gateways (
    id SERIAL PRIMARY KEY,
    enquiry_id INTEGER,
    shortlist_id INTEGER,
    client_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    loan_amount DECIMAL(15,2),
    monthly_income DECIMAL(15,2),
    existing_loans DECIMAL(15,2),
    collateral_value DECIMAL(15,2),
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    application_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'EMPLOYEE',
    department VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_enquiry_id ON documents(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_shortlist_enquiry_id ON shortlist(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_status ON shortlist(status);
CREATE INDEX IF NOT EXISTS idx_payment_enquiry_id ON payment_gateways(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_gateways(status);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

-- Enable Row Level Security for all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Allow all operations for authenticated users" ON documents
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow select for anonymous users" ON documents
    FOR SELECT USING (true);

-- Create policies for shortlist
CREATE POLICY "Allow all operations for authenticated users" ON shortlist
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow select for anonymous users" ON shortlist
    FOR SELECT USING (true);

-- Create policies for payment_gateways
CREATE POLICY "Allow all operations for authenticated users" ON payment_gateways
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for anonymous users" ON payment_gateways
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for anonymous users" ON payment_gateways
    FOR SELECT USING (true);

-- Create policies for staff
CREATE POLICY "Allow all operations for authenticated users" ON staff
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow select for anonymous users" ON staff
    FOR SELECT USING (true);

-- Create updated_at triggers for all tables
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shortlist_updated_at 
    BEFORE UPDATE ON shortlist 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_gateways_updated_at 
    BEFORE UPDATE ON payment_gateways 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at 
    BEFORE UPDATE ON staff 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO enquiries (name, business_name, mobile, email, business_type, loan_amount, source, interest_status, staff_id, assigned_staff) VALUES
('Rajesh Kumar', 'Kumar Electronics', '9876543210', 'rajesh@kumar.com', 'Electronics', 500000, 'ONLINE_APPLICATION', 'INTERESTED', 1, 'Pankil'),
('Priya Sharma', 'Sharma Textiles', '9876543211', 'priya@sharma.com', 'Textiles', 750000, 'ONLINE_APPLICATION', 'INTERESTED', 2, 'Venkat'),
('Amit Patel', 'Patel Trading Co', '9876543212', 'amit@patel.com', 'Trading', 300000, 'ONLINE_APPLICATION', 'INTERESTED', 3, 'Dinesh')
ON CONFLICT DO NOTHING;

-- Insert sample staff data
INSERT INTO staff (name, email, role, department, phone, status) VALUES
('Pankil', 'govindamarketing9998@gmail.com', 'ADMIN', 'Marketing', '9998000001', 'ACTIVE'),
('Venkat', 'gowthaamaneswar1998@gmail.com', 'MANAGER', 'Operations', '9998000002', 'ACTIVE'),
('Dinesh', 'dinesh@gmail.com', 'EMPLOYEE', 'Processing', '9998000003', 'ACTIVE'),
('Harish', 'newacttmis@gmail.com', 'ADMIN', 'Client Management', '9998000004', 'ACTIVE'),
('Nanciya', 'tmsnunciya59@gmail.com', 'ADMIN', 'Administration', '9998000005', 'ACTIVE'),
('Admin User', 'admin@gmail.com', 'SUPER_ADMIN', 'System', '9998000006', 'ACTIVE'),
('Admin User', 'admin@businessloan.com', 'ADMIN', 'Business', '9998000007', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;
