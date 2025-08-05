// Simple test to verify the AI system works
async function testAISystem() {
  try {
    console.log('Testing AI Assistant System...');
    
    // Test the chat endpoint
    const response = await fetch('http://localhost:3000/api/ai-assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Tell me about Gaurav'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ AI System is working!');
      console.log('Response:', data.data.message);
      console.log('Model used:', data.data.model);
    } else {
      console.log('❌ AI System error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testAISystem();
}