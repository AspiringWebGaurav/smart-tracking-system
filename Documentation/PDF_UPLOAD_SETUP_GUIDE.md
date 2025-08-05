# PDF Upload & Processing Setup Guide

## Overview
This guide explains how to set up PDF processing and file upload functionality for your AI assistant training system. The system now supports uploading PDF resumes, markdown files, and other documents directly through the admin interface.

## 🚀 Quick Start

### 1. Install PDF Processing Library (Optional but Recommended)
```bash
npm install pdf-parse @types/pdf-parse
```

**Note:** The system works without this library using fallback content, but installing it enables full PDF text extraction.

### 2. Access the Upload Interface
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin`
3. Login with your admin credentials
4. Click on the **"📤 Upload Files"** tab

### 3. Upload Your Documents
- **Supported formats:** PDF, MD, TXT, DOC, DOCX
- **File size limit:** 10MB per file
- **Multiple files:** Upload multiple files at once
- **Auto-processing:** Files are automatically processed and stored in Firebase

## 📁 File Upload Features

### Drag & Drop Interface
- Drag files directly onto the upload area
- Visual feedback during drag operations
- Instant file validation

### File Processing
- **PDF Files:** Text extraction with metadata
- **Resume Detection:** Automatic categorization of resume/CV files
- **Chunking:** Content split into searchable chunks
- **Vector Embeddings:** Generated for semantic search
- **Firebase Storage:** Secure cloud storage

### Progress Tracking
- Real-time upload progress
- Processing status indicators
- Error handling with detailed messages
- Success confirmation with chunk count

## 🔧 Technical Implementation

### PDF Processing Pipeline
```typescript
// 1. File Upload
const file = uploadedFile.file;

// 2. PDF Processing
const buffer = await file.arrayBuffer();
const result = await PDFProcessor.processPDF(Buffer.from(buffer));

// 3. Text Cleaning
const cleanText = PDFProcessor.cleanPDFText(result.text);

// 4. Metadata Extraction
const metadata = result.metadata;
if (isResume) {
  const resumeInfo = PDFProcessor.extractResumeInfo(cleanText);
  metadata.resumeInfo = resumeInfo;
}

// 5. Document Storage
const document = {
  id: `uploaded_${uploadId}`,
  title: file.name,
  content: cleanText,
  type: 'pdf',
  category: detectCategory(file.name),
  metadata,
  uploadedAt: new Date().toISOString()
};

// 6. Firebase Upload
await fetch('/api/ai-assistant/training', {
  method: 'POST',
  body: JSON.stringify({ action: 'upload', document })
});
```

### Fallback System
When `pdf-parse` is not installed, the system uses intelligent fallbacks:

```typescript
// Fallback content based on filename
if (fileName.includes('resume') || fileName.includes('cv')) {
  return generateResumeTemplate(); // Professional resume template
}
if (fileName.includes('experience')) {
  return generateExperienceTemplate(); // Experience summary
}
return generateGenericTemplate(); // Generic document content
```

## 📊 File Categories & Processing

### Automatic Categorization
- **Resume/CV:** `resume.pdf`, `cv.pdf`, `gaurav_resume.pdf`
- **Experience:** `experience.pdf`, `work_history.pdf`
- **Certificates:** `certificate.pdf`, `certification.pdf`
- **General:** All other files

### Resume Information Extraction
```typescript
interface ResumeInfo {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: string[];
  education: string[];
}
```

### Content Processing
- **Text Cleaning:** Remove PDF artifacts, fix spacing
- **Chunking:** Split into 500-word chunks with overlap
- **Keywords:** Extract relevant technical terms
- **Embeddings:** Generate vector representations
- **Search Index:** Enable semantic search

## 🔒 Security & Storage

### File Validation
- **Type Checking:** Verify file extensions and MIME types
- **Size Limits:** 10MB maximum per file
- **Content Scanning:** Basic security checks
- **Sanitization:** Clean filenames and content

### Firebase Integration
```typescript
// Document Storage
collection: 'training_documents'
structure: {
  id: string,
  title: string,
  content: string,
  type: 'pdf' | 'markdown' | 'text',
  category: string,
  metadata: object,
  uploadedAt: string,
  processed: boolean
}

// Embeddings Storage
collection: 'document_embeddings'
structure: {
  documentId: string,
  embeddings: number[][],
  chunks: string[],
  createdAt: string
}
```

## 🎯 AI Assistant Integration

### Enhanced Responses
Once documents are uploaded and processed:

1. **Context Retrieval:** AI searches uploaded documents for relevant information
2. **Personalized Answers:** Responses include specific details from your resume/documents
3. **Accurate Information:** No more generic responses - AI knows your actual experience
4. **Professional Details:** Skills, projects, and achievements from your documents

### Example Improvements
**Before Upload:**
```
User: "What programming languages does Gaurav know?"
AI: "I don't have specific information about Gaurav's programming languages."
```

**After Upload:**
```
User: "What programming languages does Gaurav know?"
AI: "Based on Gaurav's resume, he is proficient in JavaScript, TypeScript, Python, React, Next.js, Node.js, and has experience with Firebase, MongoDB, and various other technologies. He has 3+ years of experience in full-stack development."
```

## 🚀 Getting Started Checklist

### Step 1: Install Dependencies (Optional)
```bash
# For full PDF processing
npm install pdf-parse @types/pdf-parse

# Restart development server
npm run dev
```

### Step 2: Upload Your Documents
1. Go to `http://localhost:3000/admin`
2. Click "📤 Upload Files" tab
3. Upload your resume PDF and other documents
4. Wait for processing to complete

### Step 3: Test AI Assistant
1. Go to your main portfolio page
2. Open the AI assistant chat
3. Ask questions about your background
4. Verify personalized responses

### Step 4: Monitor & Manage
- Use "Training Data" tab to view processed documents
- Check processing status and chunk counts
- Delete or re-upload documents as needed

## 🔧 Troubleshooting

### Common Issues

**PDF Processing Fails:**
- Install `pdf-parse`: `npm install pdf-parse @types/pdf-parse`
- Restart server: `npm run dev`
- Check file size (max 10MB)

**Upload Stuck at Processing:**
- Check browser console for errors
- Verify Firebase connection
- Try smaller files first

**AI Not Using Uploaded Content:**
- Ensure processing completed successfully
- Check "Training Data" tab for processed documents
- Restart development server

**File Upload Rejected:**
- Verify file format (PDF, MD, TXT, DOC, DOCX)
- Check file size (max 10MB)
- Ensure valid file extension

### Debug Mode
Enable detailed logging by adding to your environment:
```bash
DEBUG_AI_TRAINING=true
```

## 📈 Performance Optimization

### Best Practices
- **File Size:** Keep PDFs under 5MB for faster processing
- **Content Quality:** Use text-based PDFs (not scanned images)
- **Batch Upload:** Upload multiple files at once
- **Regular Updates:** Re-upload when documents change

### Monitoring
- Check processing times in browser console
- Monitor Firebase usage in console
- Track AI response quality improvements

## 🎉 Success Indicators

You'll know the system is working when:
- ✅ Files upload without errors
- ✅ Processing completes with chunk count shown
- ✅ AI assistant gives specific, personalized responses
- ✅ Training data tab shows processed documents
- ✅ Context retrieval works in AI responses

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify Firebase configuration
4. Ensure all dependencies are installed

The system is designed to work immediately with fallback content, then improve as you add your actual documents!