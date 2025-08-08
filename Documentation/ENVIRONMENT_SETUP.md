# Environment Setup Guide

This guide will help you properly configure environment variables to fix the 404 errors and secure sensitive data.

## 🚨 Current Issues

1. **404 Error**: `/api/visitors/status` returns 404 because Firebase Admin is not configured
2. **Exposed Sensitive Data**: Firebase API keys are visible in browser console logs

## 🔧 Quick Fix

### Step 1: Copy Environment Template
```bash
cp .env.example .env.local
```

### Step 2: Configure Firebase Client (Required)
Get these values from [Firebase Console](https://console.firebase.google.com/) > Project Settings > General:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAmnF_wRSRjync2sh3IRqZYDfsTejgaW0U
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Step 3: Configure Firebase Admin (Fixes 404 Error)
1. Go to [Firebase Console](https://console.firebase.google.com/) > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the entire JSON content as a single line string:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### Step 4: Configure Admin Authentication
```env
ADMIN_ID=your_admin_email@domain.com
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```

### Step 5: Restart Development Server
```bash
npm run dev
```

## ✅ Verification

After setup, you should see:
- ✅ No Firebase API keys in browser console
- ✅ No 404 errors for `/api/visitors/status`
- ✅ Secure logging with `[REDACTED]` for sensitive data

## 🔒 Security Features Implemented

### 1. Secure Logging System
- Automatically redacts sensitive data in console logs
- Hides API keys, tokens, and passwords
- Production-safe logging that doesn't expose secrets

### 2. Graceful Error Handling
- API endpoints return meaningful errors instead of 404
- Fallback to safe defaults when services are unavailable
- Clear error messages for debugging

### 3. Environment Validation
- Validates required environment variables on startup
- Provides helpful error messages for missing configuration
- Prevents application crashes due to missing config

## 🚀 Deployment (Vercel)

### Environment Variables in Vercel Dashboard:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add all variables from your `.env.local` file
4. Make sure to set them for all environments (Production, Preview, Development)

### Important Notes:
- `NEXT_PUBLIC_*` variables are exposed to the browser (this is intentional)
- `FIREBASE_SERVICE_ACCOUNT_KEY` should be the entire JSON as a single line
- Never commit `.env.local` to version control

## 🐛 Troubleshooting

### Still seeing 404 errors?
1. Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is properly set
2. Verify the JSON is valid (use a JSON validator)
3. Ensure the service account has Firestore permissions

### Still seeing API keys in console?
1. Clear browser cache and hard refresh
2. Check that you're using the updated code with secure logging
3. Verify `NODE_ENV=production` in production environment

### Firebase Admin errors?
1. Verify service account JSON is complete and valid
2. Check that the service account has the required permissions
3. Ensure project ID matches your Firebase project

## 📝 Additional Configuration

### AI Assistant (Optional)
```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Site Configuration (Optional)
```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ADMIN_EMAIL=admin@your-domain.com
```

## 🔍 Monitoring

The application now includes:
- Secure logging that hides sensitive data
- Graceful degradation when services are unavailable
- Clear error messages for debugging
- Production-safe console output

## 📞 Support

If you continue to experience issues:
1. Check the browser console for any remaining errors
2. Verify all environment variables are set correctly
3. Ensure Firebase project permissions are configured properly
4. Test in both development and production environments