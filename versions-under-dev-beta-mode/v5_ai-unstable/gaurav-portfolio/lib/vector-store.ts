import { ProcessedDocument, DocumentChunk } from './document-processor';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, deleteDoc } from 'firebase/firestore';

// Vector embedding interface
export interface VectorEmbedding {
  id: string;
  documentId: string;
  chunkId: string;
  content: string;
  embedding: number[];
  metadata: {
    section: string;
    importance: number;
    keywords: string[];
    context: string;
    documentTitle: string;
    category: string;
  };
  createdAt: string;
}

// Search result interface
export interface SearchResult {
  content: string;
  similarity: number;
  metadata: VectorEmbedding['metadata'];
  documentId: string;
  chunkId: string;
}

// Local vector store implementation (cost-effective)
export class VectorStore {
  private static readonly COLLECTION_NAME = 'vector_embeddings';
  private static readonly EMBEDDING_DIMENSION = 384; // Using smaller dimension for efficiency
  
  // Generate embeddings using a simple local approach (TF-IDF like)
  static generateEmbedding(text: string): number[] {
    // Simple word frequency-based embedding (replace with actual embedding model if needed)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Create a vocabulary from common technical terms
    const vocabulary = this.getTechnicalVocabulary();
    const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0);
    
    // Calculate TF-IDF like scores
    words.forEach(word => {
      const index = vocabulary.indexOf(word);
      if (index !== -1 && index < this.EMBEDDING_DIMENSION) {
        embedding[index] += 1;
      }
    });
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    
    return embedding;
  }
  
  // Get technical vocabulary for embedding generation
  private static getTechnicalVocabulary(): string[] {
    return [
      // Programming languages
      'javascript', 'typescript', 'python', 'java', 'react', 'nextjs', 'nodejs',
      'html', 'css', 'sql', 'mongodb', 'firebase', 'aws', 'docker', 'kubernetes',
      
      // Technologies
      'frontend', 'backend', 'fullstack', 'api', 'rest', 'graphql', 'database',
      'authentication', 'authorization', 'security', 'performance', 'optimization',
      
      // Skills
      'developer', 'engineer', 'programming', 'coding', 'development', 'software',
      'web', 'mobile', 'application', 'system', 'architecture', 'design',
      
      // Experience terms
      'experience', 'years', 'project', 'team', 'lead', 'senior', 'junior',
      'internship', 'freelance', 'consultant', 'startup', 'enterprise',
      
      // Education
      'education', 'degree', 'bachelor', 'master', 'university', 'college',
      'certification', 'course', 'training', 'bootcamp', 'self-taught',
      
      // AI and Modern Tech
      'ai', 'artificial', 'intelligence', 'machine', 'learning', 'deep',
      'neural', 'network', 'gpt', 'openai', 'chatbot', 'automation',
      
      // Gaurav-specific terms
      'gaurav', 'portfolio', 'personal', 'contact', 'email', 'phone',
      'linkedin', 'github', 'resume', 'cv', 'hire', 'job', 'career',
      
      // Project terms
      'built', 'created', 'developed', 'implemented', 'designed', 'architected',
      'deployed', 'maintained', 'optimized', 'scaled', 'tested', 'debugged',
      
      // Soft skills
      'leadership', 'communication', 'teamwork', 'problem', 'solving',
      'analytical', 'creative', 'innovative', 'collaborative', 'agile',
      
      // Tools and frameworks
      'git', 'github', 'vscode', 'webpack', 'babel', 'eslint', 'prettier',
      'jest', 'cypress', 'postman', 'figma', 'photoshop', 'illustrator',
      
      // Business terms
      'business', 'client', 'customer', 'user', 'stakeholder', 'requirement',
      'specification', 'deadline', 'budget', 'roi', 'kpi', 'metrics',
      
      // Additional technical terms
      'responsive', 'mobile', 'desktop', 'cross-browser', 'accessibility',
      'seo', 'performance', 'loading', 'caching', 'cdn', 'ssl', 'https'
    ];
  }
  
  // Store document embeddings
  static async storeDocumentEmbeddings(document: ProcessedDocument): Promise<void> {
    try {
      console.log(`Generating embeddings for document: ${document.id}`);
      
      const embeddings: VectorEmbedding[] = [];
      
      for (const chunk of document.chunks) {
        const embedding = this.generateEmbedding(chunk.content);
        
        const vectorEmbedding: VectorEmbedding = {
          id: `${document.id}_${chunk.id}`,
          documentId: document.id,
          chunkId: chunk.id,
          content: chunk.content,
          embedding,
          metadata: {
            section: chunk.metadata.section,
            importance: chunk.metadata.importance,
            keywords: chunk.metadata.keywords,
            context: chunk.metadata.context,
            documentTitle: document.metadata.title,
            category: document.metadata.category
          },
          createdAt: new Date().toISOString()
        };
        
        embeddings.push(vectorEmbedding);
      }
      
      // Store embeddings in Firebase
      const batch = embeddings.map(async (embedding) => {
        const docRef = doc(db, this.COLLECTION_NAME, embedding.id);
        await setDoc(docRef, embedding);
      });
      
      await Promise.all(batch);
      console.log(`Stored ${embeddings.length} embeddings for document: ${document.id}`);
      
    } catch (error) {
      console.error('Error storing document embeddings:', error);
      throw error;
    }
  }
  
  // Search for similar content
  static async searchSimilar(query: string, topK: number = 5): Promise<SearchResult[]> {
    try {
      console.log(`Searching for: "${query}"`);
      
      // Generate query embedding
      const queryEmbedding = this.generateEmbedding(query);
      
      // Get all embeddings from Firebase
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const allEmbeddings: VectorEmbedding[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VectorEmbedding));
      
      // Calculate similarities
      const results: SearchResult[] = allEmbeddings.map(embedding => {
        const similarity = this.cosineSimilarity(queryEmbedding, embedding.embedding);
        
        return {
          content: embedding.content,
          similarity,
          metadata: embedding.metadata,
          documentId: embedding.documentId,
          chunkId: embedding.chunkId
        };
      });
      
      // Sort by similarity and return top K
      const topResults = results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .filter(result => result.similarity > 0.1); // Filter out very low similarities
      
      console.log(`Found ${topResults.length} relevant results`);
      return topResults;
      
    } catch (error) {
      console.error('Error searching similar content:', error);
      throw error;
    }
  }
  
  // Calculate cosine similarity between two vectors
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  // Enhanced search with keyword matching
  static async enhancedSearch(query: string, topK: number = 5): Promise<SearchResult[]> {
    try {
      // Get vector similarity results
      const vectorResults = await this.searchSimilar(query, topK * 2);
      
      // Get keyword-based results
      const keywordResults = await this.keywordSearch(query, topK);
      
      // Combine and deduplicate results
      const combinedResults = new Map<string, SearchResult>();
      
      // Add vector results with higher weight
      vectorResults.forEach(result => {
        const key = `${result.documentId}_${result.chunkId}`;
        combinedResults.set(key, {
          ...result,
          similarity: result.similarity * 0.7 // Weight vector similarity
        });
      });
      
      // Add keyword results with lower weight
      keywordResults.forEach(result => {
        const key = `${result.documentId}_${result.chunkId}`;
        const existing = combinedResults.get(key);
        
        if (existing) {
          // Boost similarity if found in both searches
          existing.similarity = Math.min(existing.similarity + 0.3, 1.0);
        } else {
          combinedResults.set(key, {
            ...result,
            similarity: result.similarity * 0.5 // Weight keyword similarity
          });
        }
      });
      
      // Return top results
      return Array.from(combinedResults.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
        
    } catch (error) {
      console.error('Error in enhanced search:', error);
      return await this.searchSimilar(query, topK); // Fallback to vector search
    }
  }
  
  // Keyword-based search
  private static async keywordSearch(query: string, topK: number): Promise<SearchResult[]> {
    try {
      const queryWords = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
      
      if (queryWords.length === 0) return [];
      
      // Get all embeddings
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const allEmbeddings: VectorEmbedding[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VectorEmbedding));
      
      // Calculate keyword similarity
      const results: SearchResult[] = allEmbeddings.map(embedding => {
        const contentWords = embedding.content.toLowerCase().split(/\s+/);
        const keywordMatches = embedding.metadata.keywords.filter(keyword => 
          queryWords.some(qWord => keyword.includes(qWord) || qWord.includes(keyword))
        );
        
        let similarity = 0;
        
        // Content word matching
        queryWords.forEach(qWord => {
          const matches = contentWords.filter(cWord => 
            cWord.includes(qWord) || qWord.includes(cWord)
          ).length;
          similarity += matches / contentWords.length;
        });
        
        // Keyword matching bonus
        similarity += keywordMatches.length * 0.2;
        
        // Importance bonus
        similarity += (embedding.metadata.importance / 10) * 0.1;
        
        return {
          content: embedding.content,
          similarity: Math.min(similarity, 1.0),
          metadata: embedding.metadata,
          documentId: embedding.documentId,
          chunkId: embedding.chunkId
        };
      });
      
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .filter(result => result.similarity > 0.1);
        
    } catch (error) {
      console.error('Error in keyword search:', error);
      return [];
    }
  }
  
  // Get embeddings by category
  static async getEmbeddingsByCategory(category: string): Promise<VectorEmbedding[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.COLLECTION_NAME),
          where('metadata.category', '==', category),
          orderBy('metadata.importance', 'desc')
        )
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VectorEmbedding));
      
    } catch (error) {
      console.error('Error getting embeddings by category:', error);
      throw error;
    }
  }
  
  // Get high importance embeddings
  static async getHighImportanceEmbeddings(minImportance: number = 7): Promise<VectorEmbedding[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const allEmbeddings: VectorEmbedding[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VectorEmbedding));
      
      return allEmbeddings
        .filter(embedding => embedding.metadata.importance >= minImportance)
        .sort((a, b) => b.metadata.importance - a.metadata.importance);
        
    } catch (error) {
      console.error('Error getting high importance embeddings:', error);
      throw error;
    }
  }
  
  // Delete embeddings for a document
  static async deleteDocumentEmbeddings(documentId: string): Promise<void> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, this.COLLECTION_NAME), where('documentId', '==', documentId))
      );
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`Deleted embeddings for document: ${documentId}`);
    } catch (error) {
      console.error('Error deleting document embeddings:', error);
      throw error;
    }
  }
  
  // Get statistics about the vector store
  static async getStats(): Promise<{
    totalEmbeddings: number;
    categoryCounts: Record<string, number>;
    averageImportance: number;
  }> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const embeddings: VectorEmbedding[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VectorEmbedding));
      
      const categoryCounts: Record<string, number> = {};
      let totalImportance = 0;
      
      embeddings.forEach(embedding => {
        const category = embedding.metadata.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        totalImportance += embedding.metadata.importance;
      });
      
      return {
        totalEmbeddings: embeddings.length,
        categoryCounts,
        averageImportance: embeddings.length > 0 ? totalImportance / embeddings.length : 0
      };
      
    } catch (error) {
      console.error('Error getting vector store stats:', error);
      throw error;
    }
  }
}