import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class SolarAIAssistant {
  private systemPrompt = `You are SolarBot, an expert AI assistant for SolarMarket - a solar marketplace platform that connects customers with verified solar installers and sellers.

CONTEXT ABOUT SOLARMARKET:
- Platform connects homeowners with solar installers and sellers
- Users can request quotes by providing house details (size in marla, appliances, monthly bill amount)
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

  async generateResponse(messages: AIMessage[]): Promise<string> {
    try {
      const conversationHistory = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      const prompt = `${this.systemPrompt}

Conversation History:
${conversationHistory}

Please provide a helpful response as SolarBot:`;

      let fullResponse = '';
      
      for await (const event of replicate.stream("openai/gpt-5", { 
        input: { 
          prompt,
          max_tokens: 500,
          temperature: 0.7
        } 
      })) {
        fullResponse += event;
      }

      return fullResponse.trim();
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateQuickResponse(userMessage: string): Promise<string> {
    try {
      const prompt = `${this.systemPrompt}

User Question: ${userMessage}

Provide a concise, helpful response as SolarBot (max 200 words):`;

      let fullResponse = '';
      
      for await (const event of replicate.stream("openai/gpt-5", { 
        input: { 
          prompt,
          max_tokens: 300,
          temperature: 0.7
        } 
      })) {
        fullResponse += event;
      }

      return fullResponse.trim();
    } catch (error) {
      console.error('Error generating quick AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}

export const solarAI = new SolarAIAssistant();