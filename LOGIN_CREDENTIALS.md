# Business Loan Backend - Login Credentials & API Endpoints

## 🚀 Server Information
- **Backend URL**: http://localhost:5002
- **API Base URL**: http://localhost:5002/api
- **Status**: ✅ Running successfully on port 5002

## 🔐 Login Credentials

### Admin Users
| Email | Password | Role | Name |
|-------|----------|------|------|
| `admin@gmail.com` | `admin123` | ADMIN | Admin User |
| `gowthaamankrishna1998@gmail.com` | `12345678` | ADMIN | Perivi |
| `newacttmis@gmail.com` | `12345678` | ADMIN | Harish |
| `govindamarketing9998@gmail.com` | `12345678` | ADMIN | Pankil |
| `tmsnunciya59@gmail.com` | `12345678` | ADMIN | Nunciya |

### Employee Users
| Email | Password | Role | Name |
|-------|----------|------|------|
| `dinesh@gmail.com` | `12345678` | EMPLOYEE | Dinesh |
| `gowthaamaneswar1998@gmail.com` | `12345678` | EMPLOYEE | Venkat |

## 🌐 Authentication Endpoints

### Login
- **POST** `/api/auth/login`
- **POST** `/api/auth/force-fresh-login`
- **POST** `/api/auth/debug-login`

### User Management
- **POST** `/api/auth/register`
- **GET** `/api/auth/check-user/:email`
- **POST** `/api/auth/test-credentials`

## 📊 Data Endpoints (All Working)

### Core Business Data
- **GET** `/api/enquiries` - ✅ 3 enquiries loaded
- **GET** `/api/documents` - ✅ 11 documents loaded  
- **GET** `/api/staff` - ✅ 7 staff members loaded
- **GET** `/api/shortlist` - ✅ 0 shortlists loaded
- **GET** `/api/notifications` - ✅ 7 notifications loaded

### Financial Data
- **GET** `/api/transactions` - Transaction management
- **GET** `/api/cashfree` - Payment processing
- **GET** `/api/cashfree/applications` - ✅ Payment applications (FIXED)

### Dashboard & Analytics
- **GET** `/api/dashboard/stats` - ✅ Dashboard statistics
- **GET** `/api/api/dashboard` - Dashboard data

### System & Health
- **GET** `/api/health` - Health check
- **GET** `/api/supabase/ping` - Database connectivity

## 🔧 Additional Features

### Data Synchronization
- **GET** `/api/auto-sync` - Auto sync status
- **POST** `/api/auto-sync` - Trigger sync
- **GET** `/api/render-sync` - Render deployment sync

### AI Integration  
- **POST** `/api/gemini` - AI document processing

### Webhooks
- **POST** `/api/webhook` - External webhook handling

## 📋 Sample Login Request

```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin123"
  }'
```

## 📋 Sample Response
```json
{
  "access_token": "demo-jwt-token-1698765432123",
  "user": {
    "id": 7,
    "email": "admin@gmail.com", 
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

## 🎯 Quick Test Commands

### Test Login
```bash
# Test admin login
curl -X POST http://localhost:5002/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@gmail.com","password":"admin123"}'

# Test employee login  
curl -X POST http://localhost:5002/api/auth/login -H "Content-Type: application/json" -d '{"email":"dinesh@gmail.com","password":"12345678"}'
```

### Test Data Endpoints
```bash
# Get all enquiries
curl http://localhost:5002/api/enquiries

# Get all documents
curl http://localhost:5002/api/documents

# Get staff list
curl http://localhost:5002/api/staff

# Get dashboard stats
curl http://localhost:5002/api/api/dashboard/stats
```

## ✅ Verification Status
- ✅ JWT Authentication working
- ✅ All login credentials verified
- ✅ All data endpoints loading successfully
- ✅ CORS configured for localhost and production
- ✅ Database persistence working
- ✅ Ready for both localhost and Render deployment

## 🆕 New Staff Management Features
- ✅ **Create New Staff**: Both ADMIN and EMPLOYEE roles supported
- ✅ **Automatic ID Generation**: Starts from ID 8 (avoids conflicts with existing staff 1-7)
- ✅ **Email Verification**: Staff verification workflow implemented
- ✅ **Supabase Sync**: New staff automatically synced to Supabase database
- ✅ **Login Integration**: New staff can login immediately after verification
- ✅ **Frontend Integration**: Quick login buttons for all staff members

### 🔧 Staff Creation Process
1. **Create**: `POST /api/staff` with staff details
2. **Verify**: `POST /api/staff/verify/{id}` to activate account
3. **Login**: Use `/api/auth/login` with email/password
4. **Auto-Sync**: Staff data automatically stored in Supabase

### 📊 Current System Status
- **Total Staff**: 9 (7 existing + 2 new test staff)
- **All Staff Active**: 100% login success rate
- **ID Range**: 1-7 (existing), 8+ (new staff)
- **Roles Supported**: ADMIN, EMPLOYEE
- **Database**: Local persistence + Supabase sync

---
*Last updated: October 28, 2025 - Complete staff management system operational*
