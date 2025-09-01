const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};

const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');

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
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN not set');
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
    const userInput = String(lastUserMessage.content).slice(0, 1000);
    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${userInput}\n\nAssistant:`;

    // Call Replicate API
    const replicateResponse = await fetch('https://api.replicate.com/v1/models/openai/o4-mini/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          prompt,
          max_tokens: 150,
          temperature: 0.4
        }
      })
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('Replicate API error:', errorText);
      throw new Error(`Replicate API error: ${replicateResponse.status}`);
    }

    let prediction = await replicateResponse.json();

    // Poll until completion
    const timeoutMs = 30000;
    const pollIntervalMs = 1000;
    const start = Date.now();

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Prediction timeout');
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`
        }
      });

      if (!pollResponse.ok) {
        throw new Error('Polling failed');
      }

      prediction = await pollResponse.json();
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Prediction failed');
    }

    // Extract response
    let aiResponse = '';
    if (Array.isArray(prediction.output)) {
      aiResponse = prediction.output.join('');
    } else if (typeof prediction.output === 'string') {
      aiResponse = prediction.output;
    } else {
      aiResponse = JSON.stringify(prediction.output || '');
    }

    aiResponse = aiResponse.trim();

    if (stream) {
      // Simulate streaming by sending response word by word
      const words = aiResponse.split(' ');
      
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for (let i = 0; i < words.length; i++) {
              const word = words[i];
              const isLast = i === words.length - 1;
              
              // Send word with space (except for last word)
              const content = isLast ? word : word + ' ';
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
              
              // Add small delay between words for streaming effect
              if (!isLast) {
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }
            
            controller.enqueue(`data: [DONE]\n\n`);
            controller.close();
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
      // Non-streaming response
      return new Response(JSON.stringify({
        response: aiResponse
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