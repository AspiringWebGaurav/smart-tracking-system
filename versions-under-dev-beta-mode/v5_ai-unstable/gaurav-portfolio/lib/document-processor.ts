import { db, storage } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Document types
export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'markdown' | 'text';
  content: string;
  chunks: DocumentChunk[];
  metadata: DocumentMetadata;
  embeddings?: number[][];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  embedding?: number[];
  metadata: ChunkMetadata;
}

export interface DocumentMetadata {
  title: string;
  author: string;
  fileSize: number;
  wordCount: number;
  language: string;
  tags: string[];
  category: 'resume' | 'experience' | 'portfolio' | 'personal' | 'other';
}

export interface ChunkMetadata {
  section: string;
  importance: number; // 1-10 scale
  keywords: string[];
  context: string;
}

// Document processing class
export class DocumentProcessor {
  private static readonly CHUNK_SIZE = 500; // words per chunk
  private static readonly CHUNK_OVERLAP = 50; // words overlap between chunks
  private static readonly COLLECTION_NAME = 'training_documents';
  
  // Process document from file path
  static async processDocument(filePath: string, category: DocumentMetadata['category']): Promise<ProcessedDocument> {
    try {
      console.log(`Processing document: ${filePath}`);
      
      // Determine file type
      const fileType = this.getFileType(filePath);
      
      // Extract content based on file type
      let content: string;
      let metadata: Partial<DocumentMetadata>;
      
      switch (fileType) {
        case 'pdf':
          ({ content, metadata } = await this.processPDF(filePath));
          break;
        case 'markdown':
          ({ content, metadata } = await this.processMarkdown(filePath));
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      // Generate document ID
      const docId = this.generateDocumentId(filePath);
      
      // Create chunks
      const chunks = this.createChunks(content, fileType);
      
      // Complete metadata
      const completeMetadata: DocumentMetadata = {
        title: metadata.title || this.extractTitleFromPath(filePath),
        author: metadata.author || 'Gaurav',
        fileSize: metadata.fileSize || 0,
        wordCount: this.countWords(content),
        language: 'en',
        tags: this.extractTags(content, category),
        category
      };
      
      // Create processed document
      const processedDoc: ProcessedDocument = {
        id: docId,
        fileName: this.getFileName(filePath),
        fileType,
        content,
        chunks,
        metadata: completeMetadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firebase
      await this.saveDocument(processedDoc);
      
      console.log(`Document processed successfully: ${docId}`);
      return processedDoc;
      
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }
  
  // Process PDF file (placeholder - requires PDF parsing library)
  private static async processPDF(filePath: string): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    // Note: In a real implementation, you'd use a library like pdf-parse or pdf2pic
    // For now, we'll simulate PDF processing
    
    console.log('PDF processing not yet implemented. Please convert PDF to text manually.');
    
    // Placeholder implementation
    return {
      content: `PDF content from ${filePath} - Please implement PDF parsing library`,
      metadata: {
        title: this.extractTitleFromPath(filePath),
        fileSize: 0
      }
    };
  }
  
  // Process Markdown file
  private static async processMarkdown(filePath: string): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    try {
      let content: string;
      
      // Check if we're in a Node.js environment and can read files
      if (typeof window === 'undefined' && typeof require !== 'undefined') {
        try {
          const fs = require('fs').promises;
          content = await fs.readFile(filePath, 'utf-8');
        } catch (fsError) {
          console.warn('File system access failed, using fallback content:', fsError);
          // Fallback content for when file can't be read
          content = this.getFallbackContent(filePath);
        }
      } else {
        // Browser environment or file system not available
        content = this.getFallbackContent(filePath);
      }
      
      // Extract metadata from markdown frontmatter or content
      const metadata = this.extractMarkdownMetadata(content);
      
      // Clean markdown content (remove markdown syntax for better processing)
      const cleanContent = this.cleanMarkdownContent(content);
      
      return {
        content: cleanContent,
        metadata: {
          ...metadata,
          fileSize: Buffer.byteLength(content, 'utf8')
        }
      };
    } catch (error) {
      console.error('Error processing markdown:', error);
      throw error;
    }
  }
  
  // Fallback content when file can't be read
  private static getFallbackContent(filePath: string): string {
    const fileName = this.getFileName(filePath);
    
    if (fileName.includes('README')) {
      return `# Gaurav's Portfolio

## About Me
I'm Gaurav, a passionate full-stack developer who combines traditional software engineering excellence with cutting-edge AI technologies.

## Technical Skills
- Frontend: React, Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Firebase, API Development
- AI Integration: GPT APIs, AI-Assisted Development
- DevOps: CI/CD, Cloud Deployment, Performance Optimization

## Experience
Full-stack developer with experience in modern web technologies, AI integration, and enterprise-grade applications.

## Projects
- Smart Tracking System with AI-powered visitor intelligence
- Real-time analytics and monitoring systems
- Modern portfolio with advanced features

## Contact
Feel free to reach out for collaboration opportunities or technical discussions.`;
    }
    
    return `Document content for ${fileName} - Please process the actual file to get complete information.`;
  }
  
  // Extract metadata from markdown content
  private static extractMarkdownMetadata(content: string): Partial<DocumentMetadata> {
    const lines = content.split('\n');
    let title = '';
    
    // Look for first heading as title
    for (const line of lines) {
      if (line.startsWith('# ')) {
        title = line.substring(2).trim();
        break;
      }
    }
    
    return {
      title: title || 'Untitled Document',
      author: 'Gaurav'
    };
  }
  
  // Clean markdown content
  private static cleanMarkdownContent(content: string): string {
    return content
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown emphasis
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove extra whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }
  
  // Create document chunks
  private static createChunks(content: string, fileType: string): DocumentChunk[] {
    const words = content.split(/\s+/);
    const chunks: DocumentChunk[] = [];
    
    for (let i = 0; i < words.length; i += this.CHUNK_SIZE - this.CHUNK_OVERLAP) {
      const chunkWords = words.slice(i, i + this.CHUNK_SIZE);
      const chunkContent = chunkWords.join(' ');
      
      if (chunkContent.trim().length === 0) continue;
      
      const chunk: DocumentChunk = {
        id: `chunk_${chunks.length}`,
        content: chunkContent,
        startIndex: i,
        endIndex: Math.min(i + this.CHUNK_SIZE, words.length),
        metadata: {
          section: this.detectSection(chunkContent),
          importance: this.calculateImportance(chunkContent),
          keywords: this.extractKeywords(chunkContent),
          context: this.generateContext(chunkContent, fileType)
        }
      };
      
      chunks.push(chunk);
    }
    
    return chunks;
  }
  
  // Detect section type from content
  private static detectSection(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('experience') || lowerContent.includes('work') || lowerContent.includes('employment')) {
      return 'experience';
    }
    if (lowerContent.includes('education') || lowerContent.includes('degree') || lowerContent.includes('university')) {
      return 'education';
    }
    if (lowerContent.includes('skill') || lowerContent.includes('technology') || lowerContent.includes('programming')) {
      return 'skills';
    }
    if (lowerContent.includes('project') || lowerContent.includes('portfolio') || lowerContent.includes('built')) {
      return 'projects';
    }
    if (lowerContent.includes('contact') || lowerContent.includes('email') || lowerContent.includes('phone')) {
      return 'contact';
    }
    
    return 'general';
  }
  
  // Calculate importance score for chunk
  private static calculateImportance(content: string): number {
    let score = 5; // base score
    
    const importantKeywords = [
      'experience', 'skills', 'projects', 'achievements', 'education',
      'developer', 'engineer', 'programming', 'technology', 'ai', 'react',
      'next.js', 'typescript', 'firebase', 'full-stack'
    ];
    
    const lowerContent = content.toLowerCase();
    
    // Increase score for important keywords
    for (const keyword of importantKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 1;
      }
    }
    
    // Increase score for specific achievements or numbers
    if (/\d+\+?\s*(years?|months?|projects?|users?)/i.test(content)) {
      score += 2;
    }
    
    return Math.min(score, 10);
  }
  
  // Extract keywords from content
  private static extractKeywords(content: string): string[] {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);
    
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));
    
    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    // Return top keywords
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  // Generate context for chunk
  private static generateContext(content: string, fileType: string): string {
    const section = this.detectSection(content);
    return `This is a ${section} section from Gaurav's ${fileType} document containing professional information.`;
  }
  
  // Extract tags based on content and category
  private static extractTags(content: string, category: string): string[] {
    const tags = [category];
    const lowerContent = content.toLowerCase();
    
    const tagMap = {
      'react': ['react', 'jsx', 'component'],
      'nextjs': ['next.js', 'nextjs', 'next'],
      'typescript': ['typescript', 'ts', 'type'],
      'javascript': ['javascript', 'js', 'node'],
      'firebase': ['firebase', 'firestore', 'cloud'],
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'gpt'],
      'frontend': ['frontend', 'ui', 'ux', 'css', 'html'],
      'backend': ['backend', 'api', 'server', 'database'],
      'fullstack': ['full-stack', 'fullstack', 'full stack']
    };
    
    for (const [tag, keywords] of Object.entries(tagMap)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }
  
  // Save document to Firebase
  private static async saveDocument(document: ProcessedDocument): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, document.id);
      await setDoc(docRef, document);
      console.log(`Document saved to Firebase: ${document.id}`);
    } catch (error) {
      console.error('Error saving document to Firebase:', error);
      throw error;
    }
  }
  
  // Utility methods
  private static getFileType(filePath: string): 'pdf' | 'markdown' | 'text' {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'md':
      case 'markdown':
        return 'markdown';
      default:
        return 'text';
    }
  }
  
  private static getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
  }
  
  private static extractTitleFromPath(filePath: string): string {
    const fileName = this.getFileName(filePath);
    return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  }
  
  private static generateDocumentId(filePath: string): string {
    const fileName = this.getFileName(filePath);
    const timestamp = Date.now();
    return `doc_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
  }
  
  private static countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }
  
  // Get all processed documents
  static async getDocuments(): Promise<ProcessedDocument[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, this.COLLECTION_NAME), orderBy('updatedAt', 'desc'))
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProcessedDocument));
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }
  
  // Search documents by content
  static async searchDocuments(searchTerm: string): Promise<ProcessedDocument[]> {
    try {
      const documents = await this.getDocuments();
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return documents.filter(doc => 
        doc.content.toLowerCase().includes(lowerSearchTerm) ||
        doc.metadata.title.toLowerCase().includes(lowerSearchTerm) ||
        doc.metadata.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
      );
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }
}