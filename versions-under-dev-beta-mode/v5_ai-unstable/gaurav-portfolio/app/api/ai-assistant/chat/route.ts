import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_MODELS } from '@/components/ai-assistant/types';
import { FREE_TIER_MODELS, ModelSelector, UsageMonitor } from '@/components/ai-assistant/models';
import { SystemPromptGenerator, QueryAnalyzer } from '@/lib/context-retrieval';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get OpenRouter API key
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OpenRouter API key not found');
      return NextResponse.json(
        { success: false, error: 'AI service temporarily unavailable' },
        { status: 500 }
      );
    }

    // Analyze the user query
    const queryAnalysis = QueryAnalyzer.analyzeQuery(message);
    
    // If not portfolio-related, return polite redirect with suggestions
    if (!queryAnalysis.isPortfolioRelated) {
      const suggestions = QueryAnalyzer.suggestBetterQuery(message);
      const suggestionText = suggestions.length > 0
        ? ` Here are some things you can ask me:\n• ${suggestions.join('\n• ')}`
        : '';
      
      return NextResponse.json({
        success: true,
        data: {
          message: `Sorry, I can only answer questions about Gaurav's portfolio. Feel free to ask about his projects, skills, experience, or how to contact him!${suggestionText}`,
          messageId: Date.now().toString(),
          suggestions: suggestions
        }
      });
    }

    // Select optimal free-tier model
    let selectedModel = ModelSelector.getOptimalModel();
    
    // Check if we can make a request with this model
    if (!UsageMonitor.canMakeRequest(selectedModel)) {
      // Try fallback model
      const fallbackModel = ModelSelector.getFallbackModel();
      if (!UsageMonitor.canMakeRequest(fallbackModel)) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please try again in a few minutes.',
          retryAfter: 60
        }, { status: 429 });
      }
      selectedModel = fallbackModel;
    }
    
    // Generate enhanced system prompt with context (with fallback)
    let enhancedSystemPrompt;
    try {
      enhancedSystemPrompt = await SystemPromptGenerator.generateEnhancedPrompt(message);
    } catch (contextError) {
      console.warn('Context retrieval failed, using fallback prompt:', contextError);
      enhancedSystemPrompt = SystemPromptGenerator.getFallbackPrompt();
    }
    
    // Prepare OpenRouter request with free-tier model
    const openRouterRequest = {
      model: selectedModel,
      messages: [
        {
          role: 'system' as const,
          content: enhancedSystemPrompt
        },
        {
          role: 'user' as const,
          content: message
        }
      ],
      max_tokens: 400, // Reduced for free tier efficiency
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    };
    
    // Record the request
    UsageMonitor.recordRequest(selectedModel);

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Gaurav Portfolio Assistant'
      },
      body: JSON.stringify(openRouterRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      
      // Record failure for model selection
      ModelSelector.recordFailure(selectedModel);
      
      // Try with fallback model if available
      const fallbackModel = ModelSelector.getFallbackModel();
      if (fallbackModel !== selectedModel && UsageMonitor.canMakeRequest(fallbackModel)) {
        try {
          const fallbackRequest = { ...openRouterRequest, model: fallbackModel };
          const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
              'X-Title': 'Gaurav Portfolio Assistant'
            },
            body: JSON.stringify(fallbackRequest)
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            UsageMonitor.recordRequest(fallbackModel);
            ModelSelector.recordSuccess(fallbackModel);
            
            return NextResponse.json({
              success: true,
              data: {
                message: fallbackData.choices[0].message.content,
                messageId: Date.now().toString(),
                model: fallbackData.model,
                usage: fallbackData.usage,
                usedFallback: true
              }
            });
          }
        } catch (fallbackError) {
          console.error('Fallback model also failed:', fallbackError);
        }
      }
      
      return NextResponse.json(
        {
          success: false,
          error: 'AI service temporarily unavailable. Please try again later.',
          modelUsed: selectedModel
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenRouter response:', data);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response from AI service' 
        },
        { status: 500 }
      );
    }

    const aiMessage = data.choices[0].message.content;
    
    // Record successful request
    ModelSelector.recordSuccess(selectedModel);

    // Log usage for monitoring
    console.log('OpenRouter API usage:', {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
      model: data.model,
      selectedModel: selectedModel,
      queryAnalysis: {
        intent: queryAnalysis.intent,
        confidence: queryAnalysis.confidence
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: aiMessage,
        messageId: Date.now().toString(),
        model: data.model,
        usage: data.usage,
        queryAnalysis: {
          intent: queryAnalysis.intent,
          confidence: queryAnalysis.confidence
        },
        usageStats: UsageMonitor.getUsageStats()
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}