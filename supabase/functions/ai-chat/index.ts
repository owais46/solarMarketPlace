import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type = 'conversation' }: AIRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Generate a contextual response based on the user's message
    let response = '';
    
    // Simple keyword-based responses for common solar questions
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      response = `Great question about solar savings! The amount you can save depends on several factors:

🏠 **Your Current Bill**: Higher electricity bills typically mean greater savings potential
⚡ **System Size**: Properly sized systems can reduce bills by 70-90%
☀️ **Location**: More sunlight = more energy production
🔋 **Usage Patterns**: When you use electricity affects savings

To get accurate savings estimates for your specific situation, I recommend:
1. **Submit a quote request** with your house details and average monthly bill
2. **Compare quotes** from multiple verified sellers on our platform
3. **Chat directly** with installers to discuss your energy needs

Would you like me to guide you through submitting a quote request? Our sellers can provide detailed savings calculations based on your actual usage!`;
    } else if (lowerMessage.includes('size') || lowerMessage.includes('system')) {
      response = `Choosing the right solar system size is crucial for maximizing your investment! Here's how to determine what you need:

📏 **Key Factors**:
- **House size** (in marla/square feet)
- **Monthly electricity bill** amount
- **Number of appliances** (ACs, refrigerators, etc.)
- **Daily usage patterns**

🔢 **Quick Estimation**:
- 1 kW system typically covers $15-25/month in electricity costs
- Average 5-marla house needs 3-5 kW system
- Larger homes with ACs may need 7-10 kW systems

📋 **Get Accurate Sizing**:
Our verified sellers can calculate the perfect system size for you! When you submit a quote request, include:
- Your house dimensions in marla
- Average monthly bill amount
- List of major appliances
- Number of lights and fans

This helps sellers provide accurate system recommendations and cost estimates. Ready to get personalized quotes?`;
    } else if (lowerMessage.includes('install') || lowerMessage.includes('process')) {
      response = `Solar installation is easier than you might think! Here's the typical process:

🔍 **1. Site Assessment** (1-2 days)
- Roof inspection and measurements
- Electrical system evaluation
- Shading analysis

📋 **2. System Design** (3-5 days)
- Custom system layout
- Equipment selection
- Permit applications

⚡ **3. Installation** (1-3 days)
- Panel mounting
- Electrical connections
- System testing

🔌 **4. Grid Connection** (1-2 weeks)
- Utility approval
- Net metering setup
- Final inspections

⏱️ **Total Timeline**: Usually 2-6 weeks from contract to activation

Our verified sellers handle all permits, inspections, and utility connections for you! They'll also provide warranties and ongoing support.

Want to connect with experienced installers in your area? Submit a quote request to get started!`;
    } else if (lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      response = `Solar costs vary based on your specific needs, but here's what to expect:

💰 **Typical Price Ranges**:
- **Residential systems**: $0.80-1.20 per watt installed
- **3 kW system**: $2,400-3,600
- **5 kW system**: $4,000-6,000
- **10 kW system**: $8,000-12,000

📊 **Cost Factors**:
- System size and equipment quality
- Roof complexity and accessibility
- Local installation rates
- Permits and inspections

💡 **Smart Shopping Tips**:
- Get multiple quotes to compare prices
- Consider long-term savings, not just upfront cost
- Ask about warranties and maintenance
- Check installer certifications

🎯 **Best Value Strategy**:
Use our platform to get quotes from multiple verified sellers! This ensures competitive pricing and helps you find the best value for your investment.

Ready to see what solar would cost for your home? Submit your details for personalized quotes!`;
    } else if (lowerMessage.includes('benefit') || lowerMessage.includes('advantage')) {
      response = `Solar energy offers amazing benefits for homeowners! Here are the key advantages:

💰 **Financial Benefits**:
- Reduce electricity bills by 70-90%
- Protect against rising energy costs
- Increase home value
- Quick payback period (3-7 years)

🌍 **Environmental Impact**:
- Reduce carbon footprint
- Clean, renewable energy
- No air or water pollution
- Help combat climate change

⚡ **Energy Independence**:
- Generate your own power
- Reduce grid dependence
- Backup power options with batteries
- Stable energy costs

🏠 **Home Value**:
- Increase property value by 3-4%
- Attractive to eco-conscious buyers
- Modern, forward-thinking upgrade

🔧 **Low Maintenance**:
- 25+ year system lifespan
- Minimal maintenance required
- Strong warranties included

Ready to start enjoying these benefits? Our verified sellers can show you exactly how much you'll save and the environmental impact you'll make. Submit a quote request to get started!`;
    } else if (lowerMessage.includes('quote') || lowerMessage.includes('request')) {
      response = `Perfect! Getting solar quotes is the best way to understand your options. Here's how our quote system works:

📝 **What You'll Need**:
- House dimensions (in marla)
- Average monthly electricity bill
- Number of lights and fans
- List of major appliances (ACs, refrigerators, etc.)
- Your contact information

🎯 **What You'll Get**:
- Multiple competitive quotes
- Detailed system specifications
- Savings calculations
- Installation timelines
- Warranty information

⭐ **Why Our Platform**:
- Only verified, certified sellers
- Compare multiple options easily
- Direct chat with installers
- Transparent pricing
- Quality guarantees

🚀 **Next Steps**:
1. Click "Request Quote" to submit your details
2. Receive quotes from multiple sellers
3. Compare options and ask questions
4. Choose the best solution for your home

Our sellers typically respond within 24 hours with detailed proposals. Ready to get started with your solar journey?`;
    } else if (lowerMessage.includes('chat') || lowerMessage.includes('talk') || lowerMessage.includes('contact')) {
      response = `Great idea! Direct communication with solar experts is one of our platform's best features:

💬 **Chat Features**:
- Real-time messaging with verified sellers
- Ask technical questions directly
- Discuss customization options
- Clarify quote details
- Schedule site visits

🔍 **When to Chat**:
- After receiving quotes
- For technical clarifications
- To discuss timeline and logistics
- For post-installation support
- To negotiate terms

👥 **Who You'll Talk To**:
- Certified solar installers
- Technical specialists
- Project managers
- Customer support teams

📱 **How to Start Chatting**:
1. Browse seller profiles or quotes
2. Click the "Chat" button
3. Start your conversation
4. Get instant responses

Our sellers are knowledgeable professionals who can answer all your solar questions. They're here to help you make the best decision for your home!

Want to start chatting with solar experts? Browse our verified sellers or submit a quote request first!`;
    } else {
      // Default response for general questions
      response = `Hello! I'm SolarBot, your AI assistant for all things solar energy! 🌞

I'm here to help you with:
- Understanding solar benefits and savings
- Choosing the right system size
- Learning about installation processes
- Navigating our marketplace platform
- Connecting with verified sellers

**Popular Questions:**
- "How much can I save with solar?"
- "What size system do I need?"
- "How does installation work?"
- "What are the benefits of going solar?"

**Platform Features:**
- 📋 Submit detailed quote requests
- 💬 Chat directly with verified sellers
- 🛒 Browse solar products and systems
- 📊 Compare multiple quotes easily

What would you like to know about solar energy or our platform? I'm here to help guide you through your solar journey!`;
    }

    return new Response(
      JSON.stringify({ response }),
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