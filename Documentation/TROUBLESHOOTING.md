# 🔧 AI Assistant Troubleshooting Guide

## Common Error: "AI service temporarily unavailable"

### Quick Fix Steps

1. **Check Your OpenRouter API Key**
   ```bash
   # Verify your .env.local file has the API key
   OPENROUTER_API_KEY=your_api_key_here
   # OR
   NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
   ```

2. **Restart Your Development Server**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

3. **Test the AI Assistant**
   - Go to your portfolio website
   - Open the AI Assistant
   - Try asking: "Tell me about Gaurav"

### What I Fixed

The error was occurring because:

1. **Context Retrieval System**: The new RAG system was trying to access training data that hadn't been processed yet
2. **File System Access**: The document processor was trying to read files that might not be accessible
3. **Missing Error Handling**: The system didn't gracefully handle when training data wasn't available

### Changes Made

1. **Added Fallback Handling** in `app/api/ai-assistant/chat/route.ts`:
   ```typescript
   // Generate enhanced system prompt with context (with fallback)
   let enhancedSystemPrompt;
   try {
     enhancedSystemPrompt = await SystemPromptGenerator.generateEnhancedPrompt(message);
   } catch (contextError) {
     console.warn('Context retrieval failed, using fallback prompt:', contextError);
     enhancedSystemPrompt = SystemPromptGenerator.getFallbackPrompt();
   }
   ```

2. **Improved File Reading** in `lib/document-processor.ts`:
   - Added fallback content when files can't be read
   - Better error handling for file system access

3. **Enhanced Error Handling** in `lib/context-retrieval.ts`:
   - All context retrieval functions now return empty results instead of throwing errors
   - Better logging for debugging

## Current Status

✅ **AI Assistant should now work** even without training data processed
✅ **Fallback responses** will be provided when context isn't available
✅ **Training system** is ready to be used when you want to add personal data

## Next Steps

### Option 1: Use AI Assistant As-Is (Immediate)
- The AI will work with general knowledge about you
- It will use the fallback prompt with basic information
- No additional setup required

### Option 2: Add Personal Training Data (Recommended)
1. Go to admin panel: `http://localhost:3000/admin`
2. Click "Training Data" tab
3. Click "Process Training Files"
4. Test the enhanced responses

## Testing the Fix

Try these queries in your AI Assistant:

1. **Basic Test**: "Tell me about Gaurav"
2. **Skills Test**: "What are Gaurav's technical skills?"
3. **Experience Test**: "What experience does Gaurav have?"
4. **Contact Test**: "How can I contact Gaurav?"

## If You Still Get Errors

### Browser Compatibility Error (Module not found: 'fs')

**Problem:** Error when accessing admin page: "Module not found: Can't resolve 'fs'"

**Cause:** PDF processing library trying to use Node.js modules in browser.

**Solution:**
1. **FIXED:** The system now handles PDF processing server-side only
2. Restart your development server: `npm run dev`
3. The upload interface now works without browser compatibility issues
4. PDF processing happens on the server when files are uploaded

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Share the specific error if you need help

### Check Server Logs
1. Look at your terminal where `npm run dev` is running
2. Check for any error messages
3. Look for OpenRouter API responses

### Verify Environment Variables
```bash
# Check if your .env.local file exists and has:
OPENROUTER_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase config
```

### File Upload Issues

**Problem:** Files fail to upload or process in the Upload Files tab.

**Solution:**
1. **File Size:** Ensure files are under 10MB
2. **Supported Formats:** Use PDF, MD, TXT, DOC, or DOCX files
3. **Processing Errors:** Check browser console for detailed error messages
4. **Server Issues:** Restart development server if uploads consistently fail

**For PDF Processing:**
- Install `pdf-parse` for full PDF support: `npm install pdf-parse @types/pdf-parse`
- System works with fallback content if library isn't installed
- Restart server after installing PDF library

## Expected Behavior Now

### Before Training Data Processing:
- ✅ AI Assistant works with general responses
- ✅ Uses fallback prompt with basic info about you
- ✅ No errors or crashes

### After Training Data Processing:
- ✅ AI Assistant provides personalized responses
- ✅ Uses your actual resume and portfolio content
- ✅ More accurate and detailed answers

## Support

If you're still experiencing issues:

1. **Check the error message** in browser console
2. **Verify API key** is correctly set
3. **Restart the development server**
4. **Try the test queries** listed above

The system is now much more robust and should handle errors gracefully!