const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

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
    const { messages, type = 'conversation' }: AIRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Get Replicate API token from environment
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!replicateToken) {
      throw new Error('REPLICATE_API_TOKEN environment variable is not set');
    }

    // Prepare the conversation for Replicate
    const conversationText = messages.map(msg => 
      `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');

    const prompt = `${systemPrompt}\n\nConversation:\n${conversationText}\n\nAssistant:`;

    // Call Replicate API directly using fetch
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "2c1608e18606fad2812020dc541930f2d0495ce32eee50074220b87300bc16e1", // Llama 2 7B Chat
        input: {
          prompt: prompt,
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          repetition_penalty: 1.15,
          system_prompt: systemPrompt
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Replicate API error:', errorData);
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    
    // Poll for completion if needed
    let result = prediction;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${replicateToken}`,
        },
      });
      
      if (!pollResponse.ok) {
        throw new Error(`Polling error: ${pollResponse.status}`);
      }
      
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error(`Prediction failed: ${result.error}`);
    }

    const aiResponse = result.output?.join('') || 'I apologize, but I\'m having trouble generating a response right now. Please try again.';

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