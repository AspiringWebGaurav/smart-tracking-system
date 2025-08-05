import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_MODELS, SYSTEM_PROMPT } from '@/components/ai-assistant/types';

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

    // Check if message is portfolio-related
    const portfolioKeywords = [
      'gaurav', 'portfolio', 'project', 'skill', 'experience', 'work', 'resume', 
      'contact', 'about', 'developer', 'frontend', 'react', 'nextjs', 'javascript',
      'typescript', 'css', 'html', 'web', 'development', 'coding', 'programming'
    ];

    const isPortfolioRelated = portfolioKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    // If not portfolio-related, return polite redirect
    if (!isPortfolioRelated) {
      return NextResponse.json({
        success: true,
        data: {
          message: "Sorry, I can only answer questions about Gaurav's portfolio. Feel free to ask about his projects, skills, experience, or how to contact him!",
          messageId: Date.now().toString()
        }
      });
    }

    // Prepare OpenRouter request
    const openRouterRequest = {
      model: OPENROUTER_MODELS.GPT_3_5_TURBO,
      messages: [
        {
          role: 'system' as const,
          content: SYSTEM_PROMPT
        },
        {
          role: 'user' as const,
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    };

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
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service temporarily unavailable. Please try again later.' 
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

    // Log usage for monitoring
    console.log('OpenRouter API usage:', {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
      model: data.model
    });

    return NextResponse.json({
      success: true,
      data: {
        message: aiMessage,
        messageId: Date.now().toString(),
        model: data.model,
        usage: data.usage
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