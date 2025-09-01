const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface AIRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  type?: 'conversation' | 'quick';
}

const systemPrompt = `You are SolarBot, an AI assistant for SolarMarket - a solar marketplace platform.

KEEP RESPONSES SHORT AND HELPFUL. Answer directly about:
- Solar energy benefits and savings
- How to use SolarMarket platform features
- Solar installation guidance
- Product recommendations

Platform features:
- Request quotes by providing house details
- Chat with verified sellers
- Browse solar products
- Compare quotes from installers

Be concise, friendly, and solar-focused.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type = 'conversation' }: AIRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Get OpenAI API token from environment
    const openaiToken = Deno.env.get('OPENAI_API_TOKEN');
    if (!openaiToken) {
      throw new Error('OPENAI_API_TOKEN environment variable is not set');
    }

    // Get only the last user message to minimize tokens
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }

    // Call OpenAI API directly
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: lastUserMessage.content }
        ],
        max_tokens: 150, // Limit response length
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.choices || result.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    const aiResponse = result.choices[0].message.content || 'I apologize, but I\'m having trouble generating a response right now. Please try again.';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('AI Assistant error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate AI response',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});