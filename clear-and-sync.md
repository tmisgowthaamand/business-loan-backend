# 🧹 Clear Supabase & Sync Current Data

## API Endpoints Available

### 1. **Complete Clear & Sync Operation**
```bash
POST http://localhost:5002/api/supabase/clear-all-and-sync
```
**What it does:**
- ✅ Clears ALL existing data from Supabase (Enquiry, Shortlist, Documents, CashfreeApplication, Staff, User tables)
- ✅ Clears ALL files from Supabase document storage bucket
- ✅ Syncs ALL current local data from your application pages to Supabase
- ✅ Maintains document collection storage organization

### 2. **Clear Supabase Only (Keep Local Data)**
```bash
POST http://localhost:5002/api/supabase/clear-supabase-only
```
**What it does:**
- ✅ Clears only Supabase data
- ✅ Keeps all your current local application data intact
- ✅ Ready for fresh sync later

### 3. **Get Sync Status**
```bash
GET http://localhost:5002/api/supabase/sync-status
```
**What it shows:**
- 📊 Current count of data in local storage vs Supabase
- 📊 Sync status for all modules (Enquiry, Document, Shortlist, Payment, Staff)
- 📊 Connection health status

## Individual Module Sync Endpoints

### Documents
```bash
POST http://localhost:5002/api/documents/clear
POST http://localhost:5002/api/documents/sync/to-supabase
GET  http://localhost:5002/api/documents/sync/status
```

### Enquiries
```bash
POST http://localhost:5002/api/enquiries/sync/to-supabase
GET  http://localhost:5002/api/enquiries/sync/status
```

### Shortlists
```bash
POST http://localhost:5002/api/shortlist/clear
POST http://localhost:5002/api/shortlist/sync/to-supabase
GET  http://localhost:5002/api/shortlist/sync/status
```

### Payment Gateway (Cashfree)
```bash
POST http://localhost:5002/api/cashfree/clear
POST http://localhost:5002/api/cashfree/sync/to-supabase
GET  http://localhost:5002/api/cashfree/sync/status
```

### Staff
```bash
POST http://localhost:5002/api/staff/clear
POST http://localhost:5002/api/staff/sync/to-supabase
GET  http://localhost:5002/api/staff/sync/status
```

## 🚀 Recommended Usage

1. **First, check current status:**
   ```bash
   GET http://localhost:5002/api/supabase/sync-status
   ```

2. **Clear everything and sync current data:**
   ```bash
   POST http://localhost:5002/api/supabase/clear-all-and-sync
   ```

3. **Verify the sync worked:**
   ```bash
   GET http://localhost:5002/api/supabase/sync-status
   ```

## ✅ What Gets Synced

**From your current application pages:**
- 📋 **Enquiries**: All client enquiries with complete information
- 📄 **Documents**: All uploaded documents with metadata and storage bucket files
- 📝 **Shortlists**: All shortlisted clients with priority and staff assignments
- 💳 **Payment Applications**: All Cashfree payment gateway applications
- 👥 **Staff**: All staff members with roles and access levels

**Document Storage:**
- 🗂️ **Document Metadata**: File information, verification status, upload dates
- 🗂️ **Document Collection**: Storage bucket organization and file references
- 🗂️ **File Storage**: Actual document files in Supabase storage bucket

## 🔄 Auto-Sync After Clear

Once you run the clear and sync operation, ALL future actions will automatically sync to Supabase:
- ✅ New enquiry submissions → Auto-sync to Supabase
- ✅ Document uploads → Auto-sync metadata + file storage
- ✅ Shortlist additions → Auto-sync to Supabase
- ✅ Payment applications → Auto-sync to Supabase
- ✅ Staff changes → Auto-sync to Supabase

## 📊 Expected Response

```json
{
  "message": "Successfully cleared existing Supabase data and synced current application data",
  "timestamp": "2025-10-17T06:48:00.000Z",
  "results": {
    "cleared": {
      "enquiries": 1,
      "documents": 1,
      "shortlists": 1,
      "payments": 1,
      "staff": 1,
      "documentFiles": 15
    },
    "synced": {
      "enquiries": 12,
      "documents": 8,
      "shortlists": 5,
      "payments": 3,
      "staff": 7
    },
    "errors": {
      "enquiries": 0,
      "documents": 0,
      "shortlists": 0,
      "payments": 0,
      "staff": 0
    }
  },
  "summary": {
    "totalCleared": 20,
    "totalSynced": 35,
    "totalErrors": 0
  }
}
```

## 🎯 No Page Disturbance

**All your existing pages will continue to work exactly as before:**
- ✅ Enquiry management pages
- ✅ Document upload/verification pages  
- ✅ Shortlist management pages
- ✅ Payment gateway pages
- ✅ Staff management pages

**The only change is that everything now automatically syncs to Supabase in the background!**
