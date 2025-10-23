# 📧 Email Configuration Guide

## SMTP Email Setup for Staff Verification

The system currently shows "mail has sent successfully" but emails are not actually being delivered because Gmail SMTP credentials are not properly configured.

### 🚨 Current Issue
- Gmail credentials are hardcoded with placeholder values
- SMTP authentication fails because credentials are invalid
- System falls back to "demo mode" and only logs emails instead of sending them

### ✅ Solution: Configure Real Gmail SMTP

#### Step 1: Prepare Your Gmail Account
1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Select "Other" as the device and name it "Business Loan System"
   - Copy the 16-character app password (e.g., `abcd efgh ijkl mnop`)

#### Step 2: Configure Environment Variables

Create a `.env` file in the backend root directory:

```bash
# Email Configuration (Gmail)
GMAIL_EMAIL="your-actual-email@gmail.com"
GMAIL_USER="your-actual-email@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-app-password"

# Alternative: SendGrid (Recommended for Production)
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="your-verified-sender@yourdomain.com"
```

#### Step 3: For Render Deployment

Add environment variables in Render dashboard:
```
GMAIL_EMAIL = your-actual-email@gmail.com
GMAIL_APP_PASSWORD = your-16-character-app-password
```

**Note:** Render may block SMTP connections. Consider using SendGrid for production.

### 🔧 Alternative: SendGrid Setup (Recommended for Production)

1. **Create SendGrid Account**
   - Sign up at [SendGrid](https://sendgrid.com/)
   - Verify your sender email/domain

2. **Get API Key**
   - Go to Settings > API Keys
   - Create a new API key with "Full Access"
   - Copy the API key

3. **Configure Environment Variables**
   ```bash
   SENDGRID_API_KEY="SG.your-api-key-here"
   SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
   ```

### 🧪 Testing Email Delivery

1. **Check Logs**
   - Look for "Gmail credentials not configured" warnings
   - Verify SMTP connection success messages

2. **Test with Staff Creation**
   - Create a new staff member
   - Check console logs for email delivery status
   - Verify actual email delivery to Gmail addresses

3. **Manual Testing**
   - Use the verification links from console logs
   - Test with actual Gmail addresses from staff list:
     - gowthaamankrishna1998@gmail.com
     - gowthaamaneswar1998@gmail.com
     - newacttmis@gmail.com
     - tmsnunciya59@gmail.com

### 📋 Current Staff Gmail Addresses

The system needs to send emails to these actual Gmail addresses:
- **Perivi**: gowthaamankrishna1998@gmail.com
- **Venkat**: gowthaamaneswar1998@gmail.com  
- **Harish**: newacttmis@gmail.com
- **Dinesh**: dinesh@gmail.com
- **Nunciya**: tmsnunciya59@gmail.com

### 🔍 Troubleshooting

#### Common Issues:
1. **"EAUTH" Error**: Wrong email or app password
2. **"ECONNECTION" Error**: Network/firewall blocking SMTP
3. **"ETIMEDOUT" Error**: SMTP server unreachable

#### Solutions:
1. **Verify Credentials**: Double-check email and app password
2. **Check 2FA**: Ensure 2-factor authentication is enabled
3. **Try SendGrid**: Use SendGrid for better reliability
4. **Check Logs**: Look for specific error messages in console

### 🚀 Production Deployment

For production environments (Render/Vercel):
1. **Use SendGrid** instead of Gmail SMTP
2. **Set Environment Variables** in deployment platform
3. **Verify Domain** for better email deliverability
4. **Monitor Logs** for email delivery status

### 📞 Support

If emails still don't work after configuration:
1. Check the console logs for specific error messages
2. Verify Gmail app password is correctly generated
3. Test with a different Gmail account
4. Consider using SendGrid for production reliability

---

**Current Status**: System falls back to demo mode and logs email templates to console. Configure real Gmail credentials to enable actual email delivery.
