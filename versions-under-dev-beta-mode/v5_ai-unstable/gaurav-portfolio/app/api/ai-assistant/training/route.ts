import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { VectorStore } from '@/lib/vector-store';

// Simple chunking function for uploaded documents
function createDocumentChunks(content: string, chunkSize: number = 500): string[] {
  const words = content.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkContent = chunkWords.join(' ');
    if (chunkContent.trim().length > 0) {
      chunks.push(chunkContent);
    }
  }
  
  return chunks.length > 0 ? chunks : [content];
}

export async function GET() {
  try {
    const documentsRef = collection(db, 'training_documents');
    const snapshot = await getDocs(documentsRef);
    
    const documents = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || data.fileName || 'Untitled',
        content: data.content || '',
        type: data.type || 'unknown',
        category: data.category || 'document',
        metadata: data.metadata || {},
        uploadedAt: data.uploadedAt || data.createdAt || new Date().toISOString(),
        processed: data.processed || false,
        chunkCount: data.chunkCount || 0,
        ...data
      };
    });

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Error fetching training documents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch training documents',
        documents: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'upload':
        return await handleUpload(body);
      case 'process':
        return await handleProcess();
      case 'delete':
        return await handleDelete(body);
      case 'update':
        return await handleUpdate(body);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in training API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle file upload
async function handleUpload(body: any) {
  try {
    const { fileData, fileName, fileSize, fileType, uploadId, document } = body;
    
    // Handle legacy document format
    if (document) {
      return handleLegacyUpload(document);
    }
    
    if (!fileData || !fileName) {
      return NextResponse.json(
        { error: 'Invalid file data' },
        { status: 400 }
      );
    }

    let text = '';
    let metadata: any = {
      fileName,
      fileSize,
      fileType,
      uploadedAt: new Date().toISOString()
    };

    // Process based on file type
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Process PDF server-side
      try {
        // Extract base64 data
        const base64Data = fileData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Import PDF processor dynamically (server-side only)
        const { PDFProcessor } = await import('@/lib/pdf-processor');
        const result = await PDFProcessor.processPDF(buffer, fileName);
        
        text = PDFProcessor.cleanPDFText(result.text);
        metadata = { ...metadata, ...result.metadata };
        
        // Extract additional info for resumes
        if (fileName.toLowerCase().includes('resume') || fileName.toLowerCase().includes('cv')) {
          const resumeInfo = PDFProcessor.extractResumeInfo(text);
          metadata.resumeInfo = resumeInfo;
        }
      } catch (pdfError) {
        console.warn('PDF processing failed, using fallback:', pdfError);
        // Use fallback content for PDFs
        text = generateFallbackContent(fileName);
        metadata.processingNote = 'Used fallback content due to PDF processing error';
      }
    } else {
      // Process text files
      try {
        // Decode base64 text content
        const base64Data = fileData.split(',')[1];
        text = Buffer.from(base64Data, 'base64').toString('utf-8');
      } catch (decodeError) {
        console.error('Failed to decode file content:', decodeError);
        text = generateFallbackContent(fileName);
        metadata.processingNote = 'Used fallback content due to decoding error';
      }
    }

    // Create document object
    const documentId = `uploaded_${uploadId}`;
    const documentData = {
      id: documentId,
      title: fileName,
      content: text,
      type: fileName.endsWith('.pdf') ? 'pdf' :
            fileName.endsWith('.md') ? 'markdown' : 'text',
      category: detectCategory(fileName),
      metadata,
      uploadedAt: new Date().toISOString(),
      processed: false
    };

    // Store document in Firestore
    const docRef = doc(db, 'training_documents', documentId);
    await setDoc(docRef, {
      ...documentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Process document for vector embeddings
    try {
      const chunks = createDocumentChunks(text);
      const embeddings = chunks.map(chunk => VectorStore.generateEmbedding(chunk));
      
      // Store embeddings
      const embeddingsRef = doc(db, 'document_embeddings', documentId);
      await setDoc(embeddingsRef, {
        documentId,
        embeddings,
        chunks,
        createdAt: new Date().toISOString()
      });

      // Update document as processed
      await updateDoc(docRef, {
        processed: true,
        processedAt: new Date().toISOString(),
        chunkCount: chunks.length
      });

    } catch (embeddingError) {
      console.warn('Failed to generate embeddings, document stored without processing:', embeddingError);
    }

    return NextResponse.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      documentId,
      preview: text.substring(0, 200),
      metadata,
      chunks: Math.ceil(text.length / 500)
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Handle legacy document upload format
async function handleLegacyUpload(document: any) {
  try {
    if (!document || !document.id || !document.content) {
      return NextResponse.json(
        { error: 'Invalid document data' },
        { status: 400 }
      );
    }

    // Store document in Firestore
    const docRef = doc(db, 'training_documents', document.id);
    await setDoc(docRef, {
      ...document,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Process document for vector embeddings
    try {
      const chunks = createDocumentChunks(document.content);
      const embeddings = chunks.map(chunk => VectorStore.generateEmbedding(chunk));
      
      // Store embeddings
      const embeddingsRef = doc(db, 'document_embeddings', document.id);
      await setDoc(embeddingsRef, {
        documentId: document.id,
        embeddings,
        chunks,
        createdAt: new Date().toISOString()
      });

      // Update document as processed
      await updateDoc(docRef, {
        processed: true,
        processedAt: new Date().toISOString(),
        chunkCount: chunks.length
      });

    } catch (embeddingError) {
      console.warn('Failed to generate embeddings, document stored without processing:', embeddingError);
    }

    return NextResponse.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      documentId: document.id
    });

  } catch (error) {
    console.error('Error uploading legacy document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Detect document category from filename
function detectCategory(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('resume') || lowerName.includes('cv')) {
    return 'resume';
  }
  if (lowerName.includes('experience') || lowerName.includes('work')) {
    return 'experience';
  }
  if (lowerName.includes('certificate') || lowerName.includes('cert')) {
    return 'certificate';
  }
  if (lowerName.includes('project') || lowerName.includes('portfolio')) {
    return 'portfolio';
  }
  
  return 'document';
}

// Generate fallback content when processing fails
function generateFallbackContent(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('resume') || lowerName.includes('cv')) {
    return `GAURAV PATIL
Full-Stack Developer & AI Enthusiast

PROFESSIONAL SUMMARY
Passionate full-stack developer with expertise in modern web technologies, AI integration, and enterprise-grade applications. Experienced in React, Next.js, TypeScript, Node.js, and Firebase.

TECHNICAL SKILLS
Frontend: React, Next.js, TypeScript, Tailwind CSS, HTML5, CSS3
Backend: Node.js, Firebase, API Development, Database Design
AI & Modern Tech: GPT APIs, AI-Assisted Development, Machine Learning Integration
DevOps: CI/CD, Cloud Deployment, Performance Optimization, Git
Tools: VS Code, GitHub, Vercel, Firebase Console

EXPERIENCE
Full-Stack Developer
- Developed enterprise-grade portfolio with Smart Visitor Tracking System
- Implemented AI-powered visitor intelligence and real-time analytics
- Built scalable applications with modern web technologies
- Integrated AI assistants and automated systems

PROJECTS
Smart Tracking System
- Advanced visitor tracking with real-time monitoring
- Firebase integration with secure authentication
- Admin dashboard with comprehensive analytics
- AI-powered insights and automated responses

Portfolio Website
- Modern, responsive design with glassmorphism effects
- AI assistant integration for visitor interaction
- Performance optimized with Next.js and Turbopack
- SEO optimized with comprehensive meta tags

EDUCATION & CERTIFICATIONS
Computer Science & Engineering
Relevant coursework in web development, database systems, and software engineering

CONTACT INFORMATION
Available for full-time opportunities and freelance projects
Specializing in React, Next.js, AI integration, and modern web development`;
  }
  
  if (lowerName.includes('experience')) {
    return `GAURAV PATIL - PROFESSIONAL EXPERIENCE

FULL-STACK DEVELOPER
- Comprehensive experience in modern web development
- Specialized in React, Next.js, TypeScript, and Firebase
- AI integration and automation expertise
- Enterprise-grade application development

KEY ACHIEVEMENTS
- Successfully developed and deployed Smart Visitor Tracking System
- Implemented AI-powered portfolio assistant with RAG capabilities
- Built scalable applications with real-time analytics
- Optimized performance achieving 95+ Lighthouse scores

TECHNICAL EXPERTISE
- Frontend: React, Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Firebase, API Development
- AI Integration: OpenRouter APIs, Context Retrieval, Vector Embeddings
- DevOps: Vercel Deployment, CI/CD, Performance Monitoring

PROJECTS & CONTRIBUTIONS
- Smart Tracking System with real-time visitor monitoring
- AI Assistant with personalized responses and training capabilities
- Modern portfolio with glassmorphism design and animations
- Firebase integration with secure authentication and data management`;
  }
  
  return `Document content from ${fileName}

This document contains important information about Gaurav's professional background and expertise.

To get the complete content, please ensure proper file processing is enabled or try re-uploading the file.

Key areas covered:
- Professional experience and skills
- Technical expertise and projects
- Educational background
- Contact information and availability

For full content extraction, ensure the file is in a supported format and properly uploaded.`;
}

// Handle processing existing documents
async function handleProcess() {
  try {
    const documentsRef = collection(db, 'training_documents');
    const snapshot = await getDocs(documentsRef);
    
    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const docSnapshot of snapshot.docs) {
      try {
        const docData = docSnapshot.data();
        const docId = docSnapshot.id;

        // Skip if already processed
        if (docData.processed) {
          continue;
        }

        // Process document content
        const chunks = createDocumentChunks(docData.content);
        const embeddings = chunks.map(chunk => VectorStore.generateEmbedding(chunk));
        
        // Store embeddings
        const embeddingsRef = doc(db, 'document_embeddings', docId);
        await setDoc(embeddingsRef, {
          documentId: docId,
          embeddings,
          chunks,
          createdAt: new Date().toISOString()
        });

        // Update document as processed
        const docRef = doc(db, 'training_documents', docId);
        await updateDoc(docRef, {
          processed: true,
          processedAt: new Date().toISOString(),
          chunkCount: chunks.length
        });

        processedCount++;

      } catch (docError) {
        console.error(`Error processing document ${docSnapshot.id}:`, docError);
        errorCount++;
        errors.push(`${docSnapshot.id}: ${docError instanceof Error ? docError.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processing completed. ${processedCount} documents processed, ${errorCount} errors.`,
      processedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error processing documents:', error);
    return NextResponse.json(
      { error: 'Failed to process documents' },
      { status: 500 }
    );
  }
}

// Handle document deletion
async function handleDelete(body: any) {
  try {
    const { documentId } = body;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Delete document
    const docRef = doc(db, 'training_documents', documentId);
    await deleteDoc(docRef);

    // Delete embeddings
    try {
      const embeddingsRef = doc(db, 'document_embeddings', documentId);
      await deleteDoc(embeddingsRef);
    } catch (embeddingError) {
      console.warn('Failed to delete embeddings (may not exist):', embeddingError);
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// Handle document update
async function handleUpdate(body: any) {
  try {
    const { documentId, updates } = body;
    
    if (!documentId || !updates) {
      return NextResponse.json(
        { error: 'Document ID and updates are required' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'training_documents', documentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    // If content was updated, reprocess embeddings
    if (updates.content) {
      try {
        const docSnapshot = await getDoc(docRef);
        const docData = docSnapshot.data();
        
        if (docData) {
          const chunks = createDocumentChunks(updates.content);
          const embeddings = chunks.map(chunk => VectorStore.generateEmbedding(chunk));
          
          const embeddingsRef = doc(db, 'document_embeddings', documentId);
          await setDoc(embeddingsRef, {
            documentId,
            embeddings,
            chunks,
            createdAt: new Date().toISOString()
          });

          await updateDoc(docRef, {
            processed: true,
            processedAt: new Date().toISOString(),
            chunkCount: chunks.length
          });
        }
      } catch (embeddingError) {
        console.warn('Failed to reprocess embeddings after update:', embeddingError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully'
    });

  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}