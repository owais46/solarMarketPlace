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
Deno.serve(async (req)=>{
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
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }
    // Get last user message only
    const lastUserMessage = messages.filter((m)=>m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }
    // Truncate input to reduce tokens
    const userInput = lastUserMessage.content.slice(0, 200); // Limit input length
    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${userInput}\n\nAssistant:`;
    // Call Replicate API (using cheaper model)
    const replicateResponse = await fetch('https://api.replicate.com/v1/models/openai/o4-mini/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          prompt,
          max_tokens: 4096
        }
      })
    });
    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('Replicate API error:', errorText);
      throw new Error(`Replicate API error: ${replicateResponse.status}`);
    }
    const prediction = await replicateResponse.json();
    // Poll for completion (max 10 seconds)
    let result = prediction;
    let attempts = 0;
    while(result.status !== 'succeeded' && result.status !== 'failed' && attempts < 10){
      await new Promise((resolve)=>setTimeout(resolve, 1000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`
        }
      });
      if (!pollRes.ok) throw new Error('Polling failed');
      result = await pollRes.json();
      attempts++;
    }
    if (result.status === 'failed') {
      throw new Error(result.error || 'Prediction failed');
    }
    const aiResponse = Array.isArray(result.output) ? result.output.join('').slice(0, 200) // Truncate output
     : result.output?.slice(0, 200) || 'No response';
    return new Response(JSON.stringify({
      response: aiResponse.trim()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
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
