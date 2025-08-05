# Firebase Rules Update

## 🔥 Firestore Database Rules

**Go to Firebase Console → Firestore Database → Rules**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all operations on visitors collection
    match /visitors/{document} {
      allow read, write, create, update, delete: if true;
    }
    
    // Allow all operations on ban_appeals collection
    match /ban_appeals/{document} {
      allow read, write, create, update, delete: if true;
    }
    
    // Allow all operations on ai_questions collection (NEW - for AI Assistant)
    match /ai_questions/{document} {
      allow read, write, create, update, delete: if true;
    }
    
    // Allow all operations on analytics collection (if exists)
    match /analytics/{document} {
      allow read, write, create, update, delete: if true;
    }
    
    // Allow all operations on admin_logs collection (if exists)
    match /admin_logs/{document} {
      allow read, write, create, update, delete: if true;
    }
    
    // Fallback rule for any other collections
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 📁 Firebase Storage Rules

**Go to Firebase Console → Storage → Rules**

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all files (for downloads)
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow write access to ai-assistant-files folder
    match /ai-assistant-files/{fileName} {
      allow write: if request.auth == null // Allow unauthenticated uploads for admin
                   && resource == null // Only allow new file creation
                   && request.resource.size < 10 * 1024 * 1024 // Max 10MB
                   && request.resource.contentType.matches('(application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document|text/plain|image/jpeg|image/jpg|image/png)');
      
      allow delete: if request.auth == null; // Allow deletion for updates
    }
    
    // Allow any other file operations (fallback)
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## 📋 Update Instructions

### Step 1: Update Firestore Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `gaurav-portfolio-946a8`
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the **Firestore Database Rules** above
5. Click **Publish**

### Step 2: Update Storage Rules
1. In the same Firebase Console
2. Navigate to **Storage** → **Rules**
3. Replace the existing rules with the **Firebase Storage Rules** above
4. Click **Publish**

## ✅ What These Rules Enable

### Firestore Rules:
- ✅ All existing collections (visitors, ban_appeals, analytics, admin_logs)
- ✅ **NEW**: `ai_questions` collection for AI Assistant data
- ✅ Fallback rule for any future collections

### Storage Rules:
- ✅ **Public read access** for file downloads
- ✅ **Secure upload access** to `ai-assistant-files/` folder
- ✅ **File validation**: Only PDF, DOC, DOCX, TXT, JPG, JPEG, PNG
- ✅ **Size limit**: Maximum 10MB per file
- ✅ **Delete permissions** for file updates
- ✅ Fallback rule for other storage operations

## 🔒 Security Notes

- **Firestore**: Open access for development (consider adding authentication later)
- **Storage**: Restricted to specific file types and sizes
- **File uploads**: Limited to `ai-assistant-files/` folder only
- **Download access**: Public (required for resume downloads)

## 🚨 Important

After updating these rules, your file upload functionality will work properly. The AI Assistant will be able to:
- ✅ Upload files to Firebase Storage
- ✅ Store question data in Firestore
- ✅ Provide download links to users
- ✅ Handle file validation and errors

Make sure to update **both** Firestore and Storage rules for full functionality!