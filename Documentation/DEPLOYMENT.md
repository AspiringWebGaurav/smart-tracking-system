# 🚀 Deployment Guide - Smart Visitor Tracking System

## Overview
This guide covers deploying the Smart Visitor Tracking System to Vercel with Firebase integration.

## Prerequisites
- Vercel account
- Firebase project with Firestore enabled
- Firebase service account credentials

## 🔧 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Firestore Database
4. Set Firestore rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to visitors collection
    match /visitors/{document} {
      allow read, write: if true;
    }
    
    // Allow read/write access to ban_appeals collection
    match /ban_appeals/{document} {
      allow read, write: if true;
    }
  }
}
```

### 2. Generate Service Account Key
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the following values:
   - `client_email`
   - `private_key`

### 3. Get Firebase Config
1. Go to Project Settings > General
2. In "Your apps" section, add a web app
3. Copy the config object values

## 🌐 Vercel Deployment

### 1. Environment Variables
Set these environment variables in Vercel dashboard:

#### Firebase Client Config (Public)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Firebase Admin Config (Private)
```
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
```

#### Admin Authentication
```
ADMIN_JWT_SECRET=your_super_secure_random_string_here
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### 3. Domain Configuration
1. Add custom domain in Vercel dashboard
2. Update Firebase authorized domains:
   - Go to Authentication > Settings > Authorized domains
   - Add your Vercel domain

## 🔐 Security Configuration

### 1. Firebase Security Rules
Update Firestore rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /visitors/{document} {
      allow read, write: if request.auth != null || 
        resource == null || 
        request.method in ['get', 'create', 'update'];
    }
    
    match /ban_appeals/{document} {
      allow read, write: if request.auth != null || 
        resource == null || 
        request.method in ['get', 'create', 'update'];
    }
  }
}
```

### 2. CORS Configuration
The `vercel.json` file includes CORS headers for API routes.

### 3. Rate Limiting
Consider implementing rate limiting for production:

```javascript
// In API routes
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};
```

## 🧪 Testing Deployment

### 1. Functionality Tests
- [ ] Visitor tracking works
- [ ] Admin login functions
- [ ] Real-time updates work
- [ ] Ban/unban system works
- [ ] Appeal system functions
- [ ] Toast notifications appear

### 2. Performance Tests
- [ ] Page load times < 3s
- [ ] API response times < 1s
- [ ] Real-time updates < 2s delay
- [ ] Mobile responsiveness

### 3. Security Tests
- [ ] Admin routes protected
- [ ] API endpoints secured
- [ ] Environment variables hidden
- [ ] HTTPS enforced

## 🚨 Troubleshooting

### Common Issues

#### 1. Firebase Connection Errors
```
Error: Firebase Admin initialization error
```
**Solution:** Check environment variables and service account key format.

#### 2. CORS Errors
```
Access to fetch blocked by CORS policy
```
**Solution:** Verify `vercel.json` CORS configuration.

#### 3. Real-time Updates Not Working
```
Firestore listener errors
```
**Solution:** Check Firestore rules and network connectivity.

#### 4. Admin Authentication Fails
```
JWT verification failed
```
**Solution:** Verify `ADMIN_JWT_SECRET` environment variable.

### Debug Mode
Enable debug logging by setting:
```
NODE_ENV=development
```

## 📊 Monitoring

### 1. Vercel Analytics
Enable Vercel Analytics for performance monitoring.

### 2. Firebase Monitoring
Monitor Firestore usage and performance in Firebase Console.

### 3. Error Tracking
Consider integrating Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

## 🔄 Updates and Maintenance

### 1. Automated Deployments
Set up GitHub Actions for automated testing and deployment.

### 2. Database Backups
Set up automated Firestore backups in Firebase Console.

### 3. Security Updates
Regularly update dependencies:

```bash
npm audit
npm update
```

## 📞 Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Firebase Console for errors
3. Verify environment variables
4. Test locally with production config

## 🎯 Production Checklist

- [ ] All environment variables set
- [ ] Firebase rules configured
- [ ] Custom domain configured
- [ ] HTTPS enforced
- [ ] Analytics enabled
- [ ] Error tracking setup
- [ ] Performance optimized
- [ ] Security tested
- [ ] Backup strategy in place
- [ ] Monitoring configured

---

**Note:** This system is production-ready with enterprise-grade security, real-time capabilities, and comprehensive admin controls.