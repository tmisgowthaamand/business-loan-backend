import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';

const supabaseUrl = 'https://vxtpjsymbcirszksrafg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dHBqc3ltYmNpcnN6a3NyYWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzY0NjAsImV4cCI6MjA3NTMxMjQ2MH0.ZYI75xNjBEhjrZb6jyxzS13BSo2oFzidPz6KdAlRvpU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDemoUsers() {
  console.log('🌱 Seeding demo users to Supabase...');

  // Core demo users - these cannot be deleted
  const demoUsers = [
    { 
      email: 'admin@gmail.com', 
      password: 'admin123', 
      role: 'ADMIN', 
      name: 'Admin User' 
    },
    { 
      email: 'gowthaamankrishna1998@gmail.com', 
      password: '12345678', 
      role: 'ADMIN', 
      name: 'Perivi' 
    }
  ];

  for (const user of demoUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from('User')
        .select('id')
        .eq('email', user.email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        console.log(`✅ User ${user.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 10);

      // Insert user
      const { data, error } = await supabase
        .from('User')
        .insert([
          {
            name: user.name,
            email: user.email,
            role: user.role,
            passwordHash: passwordHash,
            createdAt: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating user ${user.email}:`, error);
      } else {
        console.log(`✅ Created user: ${user.email} (${user.role}) with ID: ${data.id}`);
      }
    } catch (error) {
      console.error(`❌ Error processing user ${user.email}:`, error);
    }
  }

  console.log('🎉 Demo user seeding completed!');
}

// Run the seeding function
if (require.main === module) {
  seedDemoUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDemoUsers };
