# Firebase Storage Setup Guide

## Problem
You're getting the error: `Firebase Storage: An unknown error occurred, please check the error payload for server response. (storage/unknown)`

This happens because **Firebase Storage Security Rules** are missing or restrictive.

## Root Cause
- You have Firestore database rules configured ✅
- But Firebase Storage has **separate security rules** that need to be set up ❌
- Your Storage bucket currently has default restrictive rules blocking uploads

## Solution Steps

### Step 1: Deploy Storage Rules

You have two options to deploy the Storage rules:

#### Option A: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project** (if not already done):
   ```bash
   firebase init
   ```
   - Select "Storage: Configure security rules for Cloud Storage"
   - Choose your existing project: `gaurav-portfolio-946a8`
   - Accept the default `storage.rules` file

4. **Deploy the Storage rules**:
   ```bash
   firebase deploy --only storage
   ```

#### Option B: Using Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `gaurav-portfolio-946a8`
3. Navigate to **Storage** → **Rules**
4. Replace the existing rules with the content from `storage.rules` file
5. Click **Publish**

### Step 2: Verify Storage Rules

After deployment, your Storage rules should look like this:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow uploads to ai-assistant-files directory
    match /ai-assistant-files/{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
    
    // Deny access to all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Test File Upload

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the upload**:
   - Go to your admin panel
   - Try uploading a file when creating/editing an AI question
   - The upload should now work without the `storage/unknown` error

## Security Considerations

### Current Rules (Permissive)
The current rules allow anyone to read/write files in the `ai-assistant-files` directory. This is fine for:
- Development/testing
- Internal admin tools
- Public file sharing

### Enhanced Security (Optional)
If you want to restrict uploads to authenticated admins only, update the rules:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /ai-assistant-files/{allPaths=**} {
      // Allow read access to all users
      allow read: if true;
      
      // Allow write access only to authenticated users
      // (You'll need to implement Firebase Auth for this)
      allow write: if request.auth != null;
    }
    
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## File Structure
```
your-project/
├── storage.rules          # ← Storage security rules (created)
├── firestore.rules        # ← Database rules (existing)
├── lib/firebase.ts        # ← Updated with Storage initialization
└── app/api/ai-assistant/questions/route.ts  # ← Updated to use centralized storage
```

## Troubleshooting

### If you still get errors after deploying rules:

1. **Check the Firebase Console**:
   - Verify rules are deployed correctly
   - Check Storage usage/quotas

2. **Check browser console**:
   - Look for more detailed error messages
   - Verify network requests are reaching Firebase

3. **Verify environment variables**:
   - Ensure `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is correct
   - Should be: `gaurav-portfolio-946a8.firebasestorage.app`

4. **Clear browser cache** and restart dev server

### Common Issues:
- **Rules not deployed**: Run `firebase deploy --only storage` again
- **Wrong project**: Check `firebase use` shows correct project
- **Quota exceeded**: Check Firebase Console → Usage tab

## Next Steps

After fixing the Storage rules:
1. Test file uploads thoroughly
2. Consider implementing user authentication for better security
3. Monitor Storage usage in Firebase Console
4. Set up proper error handling for edge cases

---

**Note**: Firebase Storage rules are separate from Firestore rules. You need both configured for a complete Firebase setup.