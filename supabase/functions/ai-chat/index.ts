import { corsHeaders } from '../_shared/cors.ts';

const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');

interface AIRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  type?: 'conversation' | 'quick';
}

const systemPrompt = `You are SolarBot, an expert AI assistant for SolarMarket - a solar marketplace platform that connects customers with verified solar installers and sellers.

CONTEXT ABOUT SOLARMARKET:
- Platform connects homeowners with solar installers and sellers
- Users can request quotes by providing house details (size in marla, appliances, average monthly bill amount)
- Sellers can browse quote requests and submit competitive quotes
- Built-in chat system for direct communication between users and sellers
- Product marketplace where sellers list solar panels, inverters, batteries, etc.
- Role-based system: users (customers), sellers (installers), and admins

YOUR ROLE:
- Help users understand solar energy benefits and savings
- Guide users through the quotation process
- Explain solar products and technologies
- Provide general solar installation advice
- Help navigate the SolarMarket platform features

GUIDELINES:
- Always stay focused on solar energy topics and the SolarMarket platform
- Provide accurate, helpful information about solar installations
- Encourage users to request quotes through the platform
- Suggest connecting with verified sellers for specific technical questions
- Be friendly, professional, and knowledgeable about solar energy
- If asked about non-solar topics, politely redirect to solar-related assistance

PLATFORM FEATURES TO MENTION:
- Quote request system with detailed house specifications
- Chat with verified solar sellers
- Browse solar products from trusted sellers
- Compare multiple quotes from different installers
- Average monthly bill analysis for savings calculations

Remember: You're here to help users make informed decisions about solar energy and guide them through the SolarMarket platform.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN not configured');
    }

    const { messages, type = 'conversation' }: AIRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Build conversation history
    const conversationHistory = messages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const maxTokens = type === 'quick' ? 300 : 500;
    const prompt = type === 'quick' 
      ? `${systemPrompt}\n\nUser Question: ${messages[messages.length - 1].content}\n\nProvide a concise, helpful response as SolarBot (max 200 words):`
      : `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nPlease provide a helpful response as SolarBot:`;

    // Call Replicate API
    const replicateResponse = await fetch('https://api.replicate.com/v1/models/openai/gpt-5/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt,
          max_tokens: maxTokens,
          temperature: 0.7
        }
      })
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('Replicate API error:', errorText);
      throw new Error(`Replicate API error: ${replicateResponse.status}`);
    }

    const prediction = await replicateResponse.json();

    // Poll for completion
    let result = prediction;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        }
      });
      
      if (!pollResponse.ok) {
        throw new Error(`Polling error: ${pollResponse.status}`);
      }
      
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Prediction failed');
    }

    const aiResponse = Array.isArray(result.output) ? result.output.join('') : result.output;

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