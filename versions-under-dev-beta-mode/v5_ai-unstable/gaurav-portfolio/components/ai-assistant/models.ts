// Free-tier OpenRouter models optimized for your use case
export const FREE_TIER_MODELS = {
  // Primary models (most reliable free options)
  PRIMARY: {
    GEMMA_2_9B: 'google/gemma-2-9b-it:free',
    PHI_3_MINI: 'microsoft/phi-3-mini-128k-instruct:free',
    LLAMA_3_1_8B: 'meta-llama/llama-3.1-8b-instruct:free',
  },
  
  // Fallback models
  FALLBACK: {
    GEMMA_7B: 'google/gemma-7b-it:free',
    MISTRAL_7B: 'mistralai/mistral-7b-instruct:free',
    QWEN_7B: 'qwen/qwen-2-7b-instruct:free',
  }
} as const;

// Model configurations optimized for free tier
export const MODEL_CONFIGS = {
  [FREE_TIER_MODELS.PRIMARY.GEMMA_2_9B]: {
    maxTokens: 1024,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    contextWindow: 8192,
    costPerToken: 0, // Free
    rateLimit: 20, // requests per minute
    description: 'Google Gemma 2 9B - Best balance of performance and reliability'
  },
  
  [FREE_TIER_MODELS.PRIMARY.PHI_3_MINI]: {
    maxTokens: 1024,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    contextWindow: 128000,
    costPerToken: 0, // Free
    rateLimit: 15, // requests per minute
    description: 'Microsoft Phi-3 Mini - Large context window, efficient'
  },
  
  [FREE_TIER_MODELS.PRIMARY.LLAMA_3_1_8B]: {
    maxTokens: 1024,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    contextWindow: 8192,
    costPerToken: 0, // Free
    rateLimit: 25, // requests per minute
    description: 'Meta Llama 3.1 8B - Good general performance'
  }
};

// Model selection strategy
export class ModelSelector {
  private static currentModelIndex = 0;
  private static failureCount = new Map<string, number>();
  private static lastUsed = new Map<string, number>();
  
  static getOptimalModel(): string {
    const models = Object.values(FREE_TIER_MODELS.PRIMARY);
    const now = Date.now();
    
    // Find model with lowest failure rate and not recently used
    for (const model of models) {
      const failures = this.failureCount.get(model) || 0;
      const lastUsedTime = this.lastUsed.get(model) || 0;
      const timeSinceLastUse = now - lastUsedTime;
      
      // If model hasn't been used in last 3 minutes and has low failure rate
      if (timeSinceLastUse > 180000 && failures < 3) {
        this.lastUsed.set(model, now);
        return model;
      }
    }
    
    // Fallback to round-robin
    const selectedModel = models[this.currentModelIndex % models.length];
    this.currentModelIndex++;
    this.lastUsed.set(selectedModel, now);
    
    return selectedModel;
  }
  
  static recordFailure(model: string) {
    const currentFailures = this.failureCount.get(model) || 0;
    this.failureCount.set(model, currentFailures + 1);
  }
  
  static recordSuccess(model: string) {
    this.failureCount.set(model, 0); // Reset failure count on success
  }
  
  static getFallbackModel(): string {
    const fallbackModels = Object.values(FREE_TIER_MODELS.FALLBACK);
    return fallbackModels[Math.floor(Math.random() * fallbackModels.length)];
  }
}

// Usage monitoring for free tier limits
export class UsageMonitor {
  private static requestCounts = new Map<string, number>();
  private static resetTimes = new Map<string, number>();
  
  static canMakeRequest(model: string): boolean {
    const config = MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS];
    if (!config) return false;
    
    const now = Date.now();
    const resetTime = this.resetTimes.get(model) || now;
    
    // Reset counter every minute
    if (now - resetTime > 60000) {
      this.requestCounts.set(model, 0);
      this.resetTimes.set(model, now);
    }
    
    const currentCount = this.requestCounts.get(model) || 0;
    return currentCount < config.rateLimit;
  }
  
  static recordRequest(model: string) {
    const currentCount = this.requestCounts.get(model) || 0;
    this.requestCounts.set(model, currentCount + 1);
  }
  
  static getUsageStats() {
    const stats: Record<string, any> = {};
    
    for (const [model, config] of Object.entries(MODEL_CONFIGS)) {
      const count = this.requestCounts.get(model) || 0;
      const resetTime = this.resetTimes.get(model) || Date.now();
      
      stats[model] = {
        requestsThisMinute: count,
        limit: config.rateLimit,
        usage: `${count}/${config.rateLimit}`,
        resetTime: new Date(resetTime + 60000).toISOString()
      };
    }
    
    return stats;
  }
}