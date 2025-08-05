import { VectorStore, SearchResult } from './vector-store';
import { DocumentProcessor } from './document-processor';

// Context retrieval system for RAG
export class ContextRetrieval {
  private static readonly MAX_CONTEXT_LENGTH = 2000; // tokens
  private static readonly MIN_SIMILARITY_THRESHOLD = 0.2;
  
  // Retrieve relevant context for a user query
  static async getRelevantContext(query: string): Promise<{
    context: string;
    sources: SearchResult[];
    confidence: number;
  }> {
    try {
      console.log(`Retrieving context for query: "${query}"`);
      
      // Get relevant chunks using enhanced search
      const searchResults = await VectorStore.enhancedSearch(query, 8);
      
      if (searchResults.length === 0) {
        console.log('No search results found, returning empty context');
        return {
          context: '',
          sources: [],
          confidence: 0
        };
      }
      
      // Filter by similarity threshold
      const relevantResults = searchResults.filter(
        result => result.similarity >= this.MIN_SIMILARITY_THRESHOLD
      );
      
      // Build context string
      const context = this.buildContextString(relevantResults);
      
      // Calculate overall confidence
      const confidence = this.calculateConfidence(relevantResults);
      
      console.log(`Retrieved context with ${relevantResults.length} sources, confidence: ${confidence}`);
      
      return {
        context,
        sources: relevantResults,
        confidence
      };
      
    } catch (error) {
      console.error('Error retrieving context:', error);
      // Return empty context instead of throwing
      return {
        context: '',
        sources: [],
        confidence: 0
      };
    }
  }
  
  // Build context string from search results
  private static buildContextString(results: SearchResult[]): string {
    if (results.length === 0) return '';
    
    let context = '';
    let currentLength = 0;
    
    // Sort by importance and similarity
    const sortedResults = results.sort((a, b) => {
      const scoreA = (a.similarity * 0.7) + (a.metadata.importance / 10 * 0.3);
      const scoreB = (b.similarity * 0.7) + (b.metadata.importance / 10 * 0.3);
      return scoreB - scoreA;
    });
    
    for (const result of sortedResults) {
      const section = `[${result.metadata.section.toUpperCase()}] ${result.content}\n\n`;
      
      // Check if adding this section would exceed the limit
      if (currentLength + section.length > this.MAX_CONTEXT_LENGTH) {
        // Try to add a truncated version
        const remainingLength = this.MAX_CONTEXT_LENGTH - currentLength - 50; // Leave some buffer
        if (remainingLength > 100) {
          const truncated = `[${result.metadata.section.toUpperCase()}] ${result.content.substring(0, remainingLength)}...\n\n`;
          context += truncated;
        }
        break;
      }
      
      context += section;
      currentLength += section.length;
    }
    
    return context.trim();
  }
  
  // Calculate confidence score based on search results
  private static calculateConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;
    
    // Average similarity weighted by importance
    let totalScore = 0;
    let totalWeight = 0;
    
    results.forEach(result => {
      const weight = result.metadata.importance / 10;
      totalScore += result.similarity * weight;
      totalWeight += weight;
    });
    
    const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Boost confidence if we have multiple relevant sources
    const sourceBonus = Math.min(results.length / 5, 0.2);
    
    return Math.min(averageScore + sourceBonus, 1.0);
  }
  
  // Get context for specific categories
  static async getCategoryContext(category: string, limit: number = 3): Promise<string> {
    try {
      const embeddings = await VectorStore.getEmbeddingsByCategory(category);
      const topEmbeddings = embeddings.slice(0, limit);
      
      return topEmbeddings
        .map(embedding => `[${embedding.metadata.section.toUpperCase()}] ${embedding.content}`)
        .join('\n\n');
        
    } catch (error) {
      console.error(`Error getting category context for ${category}:`, error);
      return '';
    }
  }
  
  // Get high-importance context (for general knowledge about Gaurav)
  static async getHighImportanceContext(): Promise<string> {
    try {
      const embeddings = await VectorStore.getHighImportanceEmbeddings(8);
      const topEmbeddings = embeddings.slice(0, 5);
      
      return topEmbeddings
        .map(embedding => `[${embedding.metadata.section.toUpperCase()}] ${embedding.content}`)
        .join('\n\n');
        
    } catch (error) {
      console.error('Error getting high importance context:', error);
      return '';
    }
  }
}

// Enhanced system prompt generator
export class SystemPromptGenerator {
  private static readonly BASE_PROMPT = `You are Gaurav's Personal Assistant, an AI helper for Gaurav's portfolio website. Your role is to help visitors navigate the portfolio and answer questions about Gaurav's work, skills, and experience.

IMPORTANT GUIDELINES:
1. Be helpful, professional, and friendly
2. Focus ONLY on Gaurav's portfolio, projects, skills, and professional background
3. If asked about topics unrelated to Gaurav's portfolio, politely redirect: "Sorry, I can only answer questions about Gaurav's portfolio."
4. Provide specific information when possible, including links to relevant sections
5. Keep responses concise but informative (max 150 words)
6. Use a conversational but professional tone
7. Always base your answers on the provided context about Gaurav

You can help with:
- Information about Gaurav's projects and work
- Technical skills and expertise
- Professional experience
- Contact information
- Navigation around the portfolio
- Downloading resume or other materials`;

  // Generate enhanced system prompt with context
  static async generateEnhancedPrompt(userQuery?: string): Promise<string> {
    try {
      let contextualInfo = '';
      
      if (userQuery) {
        // Get specific context for the user's query
        const { context, confidence } = await ContextRetrieval.getRelevantContext(userQuery);
        
        if (confidence > 0.3 && context) {
          contextualInfo = `\n\nRELEVANT INFORMATION ABOUT GAURAV:\n${context}`;
        }
      }
      
      // If no specific context or low confidence, get general high-importance info
      if (!contextualInfo) {
        try {
          const generalContext = await ContextRetrieval.getHighImportanceContext();
          if (generalContext) {
            contextualInfo = `\n\nKEY INFORMATION ABOUT GAURAV:\n${generalContext}`;
          }
        } catch (contextError) {
          console.warn('Failed to get high importance context:', contextError);
          // Continue without context
        }
      }
      
      return `${this.BASE_PROMPT}${contextualInfo}

Remember: Always answer based on the provided information about Gaurav. If you don't have specific information to answer a question, say so politely and suggest they contact Gaurav directly.`;
      
    } catch (error) {
      console.error('Error generating enhanced prompt:', error);
      return this.getFallbackPrompt();
    }
  }
  
  // Generate prompt for specific categories
  static async generateCategoryPrompt(category: string): Promise<string> {
    try {
      const categoryContext = await ContextRetrieval.getCategoryContext(category, 5);
      
      if (!categoryContext) {
        return this.BASE_PROMPT;
      }
      
      return `${this.BASE_PROMPT}

SPECIFIC INFORMATION ABOUT GAURAV'S ${category.toUpperCase()}:
${categoryContext}

Focus your responses on this ${category} information when relevant to the user's questions.`;
      
    } catch (error) {
      console.error(`Error generating category prompt for ${category}:`, error);
      return this.BASE_PROMPT;
    }
  }
  
  // Get fallback prompt (when no context is available)
  static getFallbackPrompt(): string {
    return `${this.BASE_PROMPT}

Note: I don't have access to detailed information about Gaurav right now. Please ask specific questions about his portfolio, and I'll do my best to help based on general knowledge about his work as a full-stack developer.`;
  }
}

// Query analysis for better context retrieval
export class QueryAnalyzer {
  private static readonly INTENT_PATTERNS = {
    experience: /experience|work|job|career|employment|professional|years/i,
    skills: /skill|technology|tech|programming|language|framework|tool/i,
    projects: /project|portfolio|built|created|developed|app|website|application/i,
    education: /education|degree|university|college|study|learn|course/i,
    contact: /contact|email|phone|reach|hire|available|location/i,
    resume: /resume|cv|download|pdf|document/i,
    personal: /about|who|background|story|bio|personal/i
  };
  
  // Analyze user query to determine intent and extract keywords
  static analyzeQuery(query: string): {
    intent: string[];
    keywords: string[];
    isPortfolioRelated: boolean;
    confidence: number;
  } {
    const lowerQuery = query.toLowerCase();
    const intents: string[] = [];
    
    // Check for intent patterns
    for (const [intent, pattern] of Object.entries(this.INTENT_PATTERNS)) {
      if (pattern.test(lowerQuery)) {
        intents.push(intent);
      }
    }
    
    // Extract keywords
    const keywords = this.extractKeywords(query);
    
    // Check if portfolio-related
    const portfolioKeywords = [
      'gaurav', 'portfolio', 'project', 'skill', 'experience', 'work', 'resume',
      'contact', 'about', 'developer', 'frontend', 'react', 'nextjs', 'javascript',
      'typescript', 'css', 'html', 'web', 'development', 'coding', 'programming'
    ];
    
    const isPortfolioRelated = portfolioKeywords.some(keyword =>
      lowerQuery.includes(keyword)
    );
    
    // Calculate confidence
    let confidence = 0.5; // base confidence
    if (intents.length > 0) confidence += 0.3;
    if (isPortfolioRelated) confidence += 0.2;
    if (keywords.length > 2) confidence += 0.1;
    
    return {
      intent: intents,
      keywords,
      isPortfolioRelated,
      confidence: Math.min(confidence, 1.0)
    };
  }
  
  // Extract keywords from query
  private static extractKeywords(query: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'what', 'when', 'where', 'why', 'how', 'can', 'tell', 'me', 'about'
    ]);
    
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }
  
  // Suggest better queries if the current one is unclear
  static suggestBetterQuery(query: string): string[] {
    const analysis = this.analyzeQuery(query);
    
    if (analysis.confidence > 0.7) {
      return []; // Query is already good
    }
    
    const suggestions: string[] = [];
    
    if (!analysis.isPortfolioRelated) {
      suggestions.push(
        "Tell me about Gaurav's experience",
        "What projects has Gaurav worked on?",
        "What are Gaurav's technical skills?",
        "How can I contact Gaurav?"
      );
    } else if (analysis.intent.length === 0) {
      suggestions.push(
        `Tell me about Gaurav's ${analysis.keywords[0] || 'experience'}`,
        `What ${analysis.keywords[0] || 'skills'} does Gaurav have?`,
        `Show me Gaurav's ${analysis.keywords[0] || 'projects'}`
      );
    }
    
    return suggestions.slice(0, 3);
  }
}