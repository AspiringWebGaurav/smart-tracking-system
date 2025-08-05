# 🔥 Firebase Setup & Troubleshooting Guide

## 🎯 Overview

This guide helps you set up Firebase for the Smart Visitor Tracking System and resolve common authentication issues.

## 🔧 Environment Variables Setup

### Required Environment Variables

Create or update your `.env.local` file with the following variables:

```bash
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAmnF_wRSRjync2sh3IRqZYDfsTejgaW0U
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gaurav-portfolio-946a8.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gaurav-portfolio-946a8
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gaurav-portfolio-946a8.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=584245544308
NEXT_PUBLIC_FIREBASE_APP_ID=1:584245544308:web:e226b7654def8922151821

# Firebase Admin SDK Configuration (Server-side)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"gaurav-portfolio-946a8","private_key_id":"2ab5f2107bbc47dbaebd4875c8bb895924537a77","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDj2NSlMs5oOch9\nz2gIa4XddhTbxtMkpqOCn6khe1bpqtvpaNeKMoxLbgFQ9rK4cyRe4xkX0Qo0UU+J\n5S3fsNwR3COmnxIaT6+Hgw/rR/Pq3uLVs3lN5hVwbhjOSXSq7xVthpBcygobkWEj\ndLSFIACqxP4H2DAjYtRhJR/qJKztTjmN5c9tcQzOxvjkK2qI+tKozftRNugnyX6x\njk4N3HH/p31IVhzEAVhdEZlPbCMUKxo31fKSR2ggjWrQol91LJp41q1jpOVsgBHv\n0o7lzShXqn98jTKq7JNYsYSl15pJZc+pybswZOzwpWofZEnUXKwmlkDei7512Bpv\npGvRQ++rAgMBAAECggEAIc88PVKXhVNvDZgtcvO9lqSzKKpNYjFmBE071CTmEIto\nJtpbWChIYC2v0qX2KYpQbydvbZ95I6qdzQkDGx/hMAyaBQYIB3vOlfhb8DOqSAO7\nO4Rub3brtIC/JpEzgjqIU/XKozI0eMMZsSCxZCsLs6DCpJhZtaPbKZp612GKKuDl\nExKnDn7F7nnBZaLXRy078o0PvHSqt9vgluPsR7f+dxHOOAVW4DhWGZUTWGjYgOWP\nPpoqCc/tRHkBD9kqrGtBriCphCSA5j0imfAusaSbfdomePGDje2fw3sxqWRYgWKp\npR3go3hUC12Jg1PdlnlQHeMgud7/LyAI7frB4d+/9QKBgQD/efuYxYJZqR26k+Q9\nxBZCWENdfR3CiX/Ruju+RRpURm7/QBkgCDn8wV4dfTvzdOg6l7GMEl0BGEKG+KG6\n+B3Sv+hrsIMAO1lHNLQQgyerpdjkc6V13mOWs74DFfT45Ot8p3IYMF+oLcIY/DGv\nTCK5vjeCA8C/fbsYhqW/8hEadQKBgQDkUFqh9X4rYsbmsiDQU4bS5QK33gMMJhjX\nR6RmTDTEWuOUc7J2YHZ1hJVtc+XrJEWsYYTZYToLcr24aHbuMudjNdONGit4y4nh\nif/JiGaaei/xjTz2cSrWUDSW3W6oI3uiogr4FZyf36HLX7LZcDv8En5cy+RSrE1a\n51TaKOhdnwKBgQDq7NgQlucT3fDJhn+m0K8LWTCxQoFgR6JzUIbpo4/fmVkufVnd\nW9M++u25vlSnvoRihOWugaBmhlF+3hmS3eBG0VQ/2vPL/cdONEe0u3Z6YCq/gRzQ\n86yugyCio8k+KvvlB/FiDvGXrGRFJ3vkz+VK2oEenKbdMBghKIg4prdVlQKBgQCA\nyzt1ZbE49E3T0eRk4NmLmpi/9EOv1MXqm4WIF7Ekm0kKc4HW+W+Zt6M7zUeEMEAF\nkDWLEyfVUXLo1jVRBfI1qyWd0Yd4awlq65gZrhKDTi5BizU6qHhL0Y75FAzaWLnj\n8plRfY+POG5i9adEteWAu0YBPxub74rrntflAXKjbQKBgQDTVe0B/3TQ58b/cET6\nLzA9Yb19IVV6YO1H4uB/KcnQt07QeyehPUFwcLMBz61APou4Vabnb+Gzlx1WIx44\n+C1LRkzsxhKJuWg8uybZx0vogtmKicoMmqEy1UDCCHXtfiqkZy8jYa9F/M2ofL8y\nlj+AC4SmgSAiKkGsRBt9gIUCfw==\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@gaurav-portfolio-946a8.iam.gserviceaccount.com","client_id":"101378745679987862769","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gaurav-portfolio-946a8.iam.gserviceaccount.com","universe_domain":"googleapis.com"}

# JWT Secret for Admin Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=contact_service
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=contact_form
NEXT_PUBLIC_EMAILJS_USER_TEMPLATE_ID=user_confirmation
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=jCsW86FQoPvuSnDWH
```

## 🚨 Common Issues & Solutions

### Issue 1: "Could not load the default credentials"

**Error Message:**
```
Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
```

**Solution:**
1. Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` is properly set in `.env.local`
2. Restart the development server: `npm run dev`
3. Check that the service account key is valid JSON

### Issue 2: "Missing or insufficient permissions"

**Error Message:**
```
FirebaseError: Missing or insufficient permissions.
```

**Solution:**
1. Verify Firebase project permissions
2. Ensure the service account has proper roles:
   - Firebase Admin SDK Administrator Service Agent
   - Cloud Datastore User
3. Check Firestore security rules

### Issue 3: Admin Auto-Login

**Issue:** Admin automatically logs in without entering credentials

**Cause:** JWT token is still valid and stored in HTTP-only cookies

**Solution:** This is expected behavior. To force re-login:
1. Clear browser cookies for localhost:3000
2. Or use the logout button in admin dashboard

### Issue 4: Logout Not Working

**Issue:** Logout button doesn't properly log out

**Solution:** 
- Fixed in the latest version
- Logout now properly clears cookies and redirects
- If in popup window, it will close the window
- If in regular tab, it will redirect to login page

### Issue 5: Ban Functionality Failing

**Issue:** "Failed to ban visitor" error

**Cause:** Firebase Admin SDK authentication issues

**Solution:**
1. Ensure Firebase Admin SDK is properly initialized
2. Check that service account has write permissions
3. Verify Firestore security rules allow admin operations

## 🔧 Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Copy the environment variables above to your `.env.local` file

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test Firebase Connection
1. Visit `http://localhost:3000`
2. Check browser console for Firebase initialization messages
3. Should see: "✅ Firebase Admin initialized successfully"

## 🧪 Testing the System

### Test Visitor Tracking
1. Open `http://localhost:3000` in browser
2. Check browser console for visitor tracking logs
3. Visit `http://localhost:3000/admin` to see tracked visitors

### Test Admin Authentication
1. Go to `http://localhost:3000/admin`
2. Should open login in new window
3. Use credentials: `gaurav` / `1234`
4. Should redirect to admin dashboard

### Test Ban/Unban Functionality
1. In admin dashboard, select a visitor
2. Click "Ban" button
3. Should see success toast
4. Visitor status should update to "banned"

## 🔒 Security Considerations

### Production Deployment
1. **Change JWT Secret:** Update `JWT_SECRET` to a strong, unique value
2. **Firestore Rules:** Implement proper security rules
3. **Environment Variables:** Use secure environment variable storage
4. **HTTPS Only:** Ensure all cookies are secure in production

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to visitors collection for authenticated users
    match /visitors/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
    
    // Allow read/write access to ban_appeals collection
    match /ban_appeals/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

## 📊 Monitoring & Debugging

### Enable Debug Logging
Add to your `.env.local`:
```bash
NEXT_PUBLIC_DEBUG=true
```

### Check Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select your project: `gaurav-portfolio-946a8`
3. Check Firestore for data
4. Monitor usage and errors

### Browser Developer Tools
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application tab for cookies and local storage

## 🆘 Getting Help

If you're still experiencing issues:

1. **Check the logs:** Look at both browser console and terminal output
2. **Verify environment variables:** Ensure all required variables are set
3. **Test Firebase connection:** Use Firebase Console to verify project access
4. **Clear cache:** Clear browser cache and cookies
5. **Restart server:** Stop and restart the development server

## 📝 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)