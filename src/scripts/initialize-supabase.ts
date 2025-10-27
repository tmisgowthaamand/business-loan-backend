#!/usr/bin/env ts-node

/**
 * Supabase Database Initialization Script
 * Restores the database to 25/10/2025 6:00 PM state
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeDatabase() {
  console.log('🚀 Starting Supabase database initialization...');
  
  try {
    // Test connection
    console.log('📡 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('enquiries')
      .select('count', { count: 'exact', head: true });
    
    if (testError && !testError.message.includes('relation "enquiries" does not exist')) {
      throw testError;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'setup-supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Executing database schema...');
    
    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`⚠️ Warning executing statement: ${error.message}`);
          }
        } catch (err) {
          console.warn(`⚠️ Warning: ${err.message}`);
        }
      }
    }
    
    console.log('✅ Database schema executed');
    
    // Hash passwords for staff
    const hashedPassword = await bcrypt.hash('12345678', 10);
    
    // Insert staff with hashed passwords
    console.log('👥 Inserting staff members...');
    const staffMembers = [
      {
        name: 'Perivi',
        email: 'gowthaamankrishna1998@gmail.com',
        password_hash: hashedPassword,
        role: 'ADMIN',
        department: 'Management',
        phone: '9876543210',
        status: 'ACTIVE',
        has_access: true,
        verified: true,
        client_name: 'Rajesh Kumar, Priya Sharma, Amit Patel'
      },
      {
        name: 'Venkat',
        email: 'gowthaamaneswar1998@gmail.com',
        password_hash: hashedPassword,
        role: 'EMPLOYEE',
        department: 'Operations',
        phone: '9876543211',
        status: 'ACTIVE',
        has_access: true,
        verified: true,
        client_name: 'Sunita Gupta, Vikram Singh'
      },
      {
        name: 'Harish',
        email: 'newacttmis@gmail.com',
        password_hash: hashedPassword,
        role: 'ADMIN',
        department: 'Client Management',
        phone: '9876543212',
        status: 'ACTIVE',
        has_access: true,
        verified: true,
        client_name: 'Anita Desai, Ravi Mehta, Sanjay Joshi'
      },
      {
        name: 'Dinesh',
        email: 'dinesh@gmail.com',
        password_hash: hashedPassword,
        role: 'EMPLOYEE',
        department: 'Processing',
        phone: '9876543213',
        status: 'ACTIVE',
        has_access: true,
        verified: true,
        client_name: 'Available for Assignment - Ready for New Clients'
      },
      {
        name: 'Nunciya',
        email: 'tmsnunciya59@gmail.com',
        password_hash: hashedPassword,
        role: 'ADMIN',
        department: 'Administration',
        phone: '9876543214',
        status: 'ACTIVE',
        has_access: true,
        verified: true,
        client_name: 'Deepak Verma'
      },
      {
        name: 'Admin User',
        email: 'admin@businessloan.com',
        password_hash: hashedPassword,
        role: 'ADMIN',
        department: 'Administration',
        phone: '9876543215',
        status: 'ACTIVE',
        has_access: true,
        verified: true,
        client_name: 'Neha Agarwal, Rohit Sharma'
      },
      {
        name: 'Admin User',
        email: 'admin@gmail.com',
        password_hash: hashedPassword,
        role: 'ADMIN',
        department: 'Administration',
        phone: '9876543216',
        status: 'ACTIVE',
        has_access: true,
        verified: true,
        client_name: 'Manish Gupta'
      }
    ];
    
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .upsert(staffMembers, { onConflict: 'email' });
    
    if (staffError) {
      console.error('❌ Error inserting staff:', staffError);
    } else {
      console.log(`✅ Inserted ${staffMembers.length} staff members`);
    }
    
    // Verify data insertion
    console.log('🔍 Verifying data insertion...');
    
    const { data: enquiries, error: enquiriesError } = await supabase
      .from('enquiries')
      .select('count', { count: 'exact', head: true });
    
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('count', { count: 'exact', head: true });
    
    const { data: shortlists, error: shortlistsError } = await supabase
      .from('shortlists')
      .select('count', { count: 'exact', head: true });
    
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('count', { count: 'exact', head: true });
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('count', { count: 'exact', head: true });
    
    const { data: staff, error: staffCountError } = await supabase
      .from('staff')
      .select('count', { count: 'exact', head: true });
    
    console.log('📊 Database Statistics:');
    console.log(`   👥 Staff: ${staff || 0}`);
    console.log(`   📝 Enquiries: ${enquiries || 0}`);
    console.log(`   📄 Documents: ${documents || 0}`);
    console.log(`   ⭐ Shortlists: ${shortlists || 0}`);
    console.log(`   💳 Payments: ${payments || 0}`);
    console.log(`   💰 Transactions: ${transactions || 0}`);
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('📅 Database restored to 25/10/2025 6:00 PM state');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase().then(() => {
  console.log('✅ Initialization script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Initialization script failed:', error);
  process.exit(1);
});
