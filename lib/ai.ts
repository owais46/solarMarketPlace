export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class SolarAIAssistant {
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`;
  }

  async generateResponse(messages: AIMessage[]): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          type: 'conversation'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      return data.response || 'I apologize, but I\'m having trouble generating a response right now. Please try again.';
    } catch (error: any) {
      console.error('Error calling AI assistant:', error);
      throw new Error(error.message || 'Failed to generate AI response');
    }
  }

  async generateQuickResponse(userMessage: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          type: 'quick'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      return data.response || 'I apologize, but I\'m having trouble generating a response right now. Please try again.';
    } catch (error: any) {
      console.error('Error calling AI assistant:', error);
      throw new Error(error.message || 'Failed to generate AI response');
    }
  }
}

export const solarAI = new SolarAIAssistant();