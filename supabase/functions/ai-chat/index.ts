const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};

const OPENAI_API_TOKEN = Deno.env.get('OPENAI_API_TOKEN');

const SYSTEM_PROMPT = `You are SolarBot, an AI assistant for SolarMarket - a solar marketplace platform.

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    if (!OPENAI_API_TOKEN) {
      throw new Error('OPENAI_API_TOKEN not set');
    }

    const { messages, stream = true } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Get last user message only to minimize tokens
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }

    // Truncate input to reduce tokens
    const userInput = lastUserMessage.content.slice(0, 200);

    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userInput }
    ];

    // Call OpenAI API with streaming
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: openaiMessages,
        max_tokens: 150,
        temperature: 0.7,
        stream: stream
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    if (stream) {
      // Return streaming response
      const readable = new ReadableStream({
        async start(controller) {
          const reader = openaiResponse.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                controller.enqueue(`data: [DONE]\n\n`);
                controller.close();
                break;
              }

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  if (data === '[DONE]') {
                    controller.enqueue(`data: [DONE]\n\n`);
                    continue;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } catch (error) {
            console.error('Streaming error:', error);
            controller.enqueue(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // Non-streaming response (fallback)
      const result = await openaiResponse.json();
      const aiResponse = result.choices?.[0]?.message?.content || 'No response';

      return new Response(JSON.stringify({
        response: aiResponse.trim()
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

  } catch (error) {
    console.error('AI Assistant error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate AI response',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});