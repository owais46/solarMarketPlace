# 🌞 SolarMarket - Solar Energy Marketplace Platform

A comprehensive solar energy marketplace platform built with Next.js, Supabase, and modern web technologies. SolarMarket connects homeowners with verified solar installers, provides AI-powered assistance, and streamlines the solar adoption process in Pakistan.

## 🚀 Features

### 👥 **Multi-Role System**
- **Customers**: Request quotes, browse products, chat with sellers
- **Sellers**: Manage products, respond to quotes, communicate with customers
- **Admins**: Platform management, user oversight, system analytics

### 🤖 **AI-Powered Assistant**
- **SolarBot**: Intelligent AI assistant for solar energy guidance
- **Real-time chat**: Instant responses to solar-related questions
- **Platform guidance**: Help with using marketplace features
- **Savings calculations**: Estimate potential solar savings

### 💬 **Real-Time Communication**
- **Direct messaging**: Chat between customers and sellers
- **Real-time updates**: Instant message delivery
- **Conversation management**: Organized chat history
- **Unread indicators**: Track new messages

### 📋 **Quotation System**
- **Detailed requests**: Comprehensive house and energy requirements
- **Multiple quotes**: Receive quotes from multiple sellers
- **Quote comparison**: Compare pricing, timelines, and specifications
- **Status tracking**: Monitor quote acceptance/rejection

### 🛍️ **Product Marketplace**
- **Product catalog**: Browse solar panels, inverters, batteries
- **Advanced search**: Filter by category, price, specifications
- **Seller profiles**: View seller information and ratings
- **Product details**: Comprehensive specifications and images

### 🎫 **Support System**
- **Ticket management**: Submit and track support requests
- **Priority levels**: Low, medium, high priority tickets
- **Admin responses**: Get help from platform administrators
- **Status tracking**: Monitor ticket resolution progress

### 📊 **Admin Dashboard**
- **User management**: View, edit, delete user accounts
- **System analytics**: Dynamic charts and reports
- **Support management**: Handle customer support tickets
- **Platform monitoring**: System health and performance metrics

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 13**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Chart.js**: Dynamic data visualization
- **Heroicons**: Beautiful icon library

### **Backend & Database**
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Robust relational database
- **Real-time subscriptions**: Live data updates
- **Edge Functions**: Serverless API endpoints
- **Row Level Security**: Data protection and access control

### **UI Components**
- **shadcn/ui**: Modern component library
- **Radix UI**: Accessible component primitives
- **React Hook Form**: Form management
- **React Hot Toast**: Notification system

## 📁 Project Structure

```
solarMarketPlace/
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin dashboard and management
│   │   ├── page.tsx             # Admin dashboard with charts
│   │   ├── users/               # User management
│   │   ├── reports/             # System reports and analytics
│   │   └── support/             # Support ticket management
│   ├── auth/                    # Authentication pages
│   │   ├── signin/              # Sign in page
│   │   └── signup/              # Sign up page
│   ├── chat/                    # Real-time messaging
│   ├── dashboard/               # User dashboard
│   ├── products/                # Product marketplace
│   ├── quotes/                  # Quotation system
│   ├── seller/                  # Seller dashboard and tools
│   ├── support/                 # User support tickets
│   ├── profile/                 # User profile management
│   ├── ai-assistant/            # AI chat interface
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   └── globals.css              # Global styles
├── components/                   # Reusable components
│   ├── Layout/                  # Layout components
│   │   ├── Navbar.tsx           # Navigation bar
│   │   ├── ProtectedRoute.tsx   # Route protection
│   │   └── UserDropdown.tsx     # User menu dropdown
│   ├── Chat/                    # Chat components
│   │   ├── AIChatWidget.tsx     # AI chat widget
│   │   ├── ConversationList.tsx # Chat sidebar
│   │   └── MessageArea.tsx      # Message display
│   └── ui/                      # shadcn/ui components
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts              # Authentication hook
│   └── useTheme.ts             # Theme management
├── lib/                        # Utility libraries
│   ├── supabase.ts             # Supabase client and types
│   ├── ai.ts                   # AI assistant integration
│   └── utils.ts                # Utility functions
├── supabase/                   # Supabase configuration
│   ├── functions/              # Edge functions
│   │   └── ai-chat/            # AI chat endpoint
│   └── migrations/             # Database migrations
└── README.md                   # Project documentation
```

## 🗄️ Database Schema

### **Core Tables**
- **users**: User profiles with role-based access
- **products**: Seller product catalog
- **quotation_requests**: Customer solar installation requests
- **quotation_responses**: Seller quotes and proposals
- **conversations**: Chat conversations between users
- **messages**: Individual chat messages
- **support_tickets**: Customer support system

### **Key Relationships**
- Users → Quotation Requests (1:many)
- Quotation Requests → Quotation Responses (1:many)
- Users ↔ Conversations (many:many through user_id/seller_id)
- Conversations → Messages (1:many)
- Users → Support Tickets (1:many)

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ installed
- Supabase account and project
- Environment variables configured

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd solarMarketPlace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Run the migrations in your Supabase dashboard
   - Or use the Supabase CLI to apply migrations

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Application**
   Navigate to `http://localhost:3000`

## 👥 User Roles & Permissions

### **🏠 Customer (User)**
- **Dashboard**: Personal overview with quote status
- **Request Quotes**: Submit detailed solar installation requirements
- **Browse Products**: Explore solar product marketplace
- **Chat with Sellers**: Direct communication with installers
- **AI Assistant**: Get instant solar energy guidance
- **Support Tickets**: Submit and track support requests

### **🏢 Seller**
- **Dashboard**: Business overview with performance metrics
- **Product Management**: Add, edit, manage product catalog
- **Quote Management**: Respond to customer requests
- **Customer Chat**: Communicate with potential customers
- **Performance Analytics**: Track acceptance rates and growth

### **⚙️ Admin**
- **System Dashboard**: Platform overview with analytics
- **User Management**: View, edit, delete user accounts
- **System Reports**: Dynamic charts and data visualization
- **Support Management**: Handle customer support tickets
- **Platform Monitoring**: System health and performance

## 🔧 Key Features Explained

### **🤖 AI Assistant (SolarBot)**
- **Powered by**: Supabase Edge Functions with AI integration
- **Capabilities**: Solar energy guidance, platform help, savings calculations
- **Access**: Available to all users via chat widget or dedicated page
- **Real-time**: Instant responses with streaming support

### **💬 Real-Time Chat System**
- **Technology**: Supabase real-time subscriptions
- **Features**: Instant messaging, read receipts, conversation management
- **Security**: Role-based access with proper authentication
- **UI**: Modern chat interface with message history

### **📊 Dynamic Analytics**
- **Charts**: Chart.js integration with real-time data
- **Metrics**: User growth, quote activity, revenue tracking
- **Time Ranges**: 7-day, 30-day, 90-day views
- **Export**: CSV download functionality

### **🎫 Support Ticketing**
- **User Side**: Submit tickets with priority levels
- **Admin Side**: Manage, respond, and resolve tickets
- **Status Tracking**: Open → In Progress → Resolved
- **Communication**: Admin responses with user notifications

## 🎨 Design System

### **Color Palette**
- **Primary**: Orange gradient (solar energy theme)
- **Secondary**: Blue accents (trust and reliability)
- **Success**: Green (positive actions)
- **Warning**: Yellow (pending states)
- **Error**: Red (alerts and errors)

### **Typography**
- **Font**: Inter (clean, modern, readable)
- **Hierarchy**: Clear heading structure
- **Spacing**: Consistent 8px grid system

### **Components**
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Forms**: Clean inputs with focus states
- **Navigation**: Intuitive menu structure

## 🔐 Security Features

### **Authentication**
- **Supabase Auth**: Secure user authentication
- **Role-based Access**: Different permissions per user type
- **Protected Routes**: Route-level access control
- **Session Management**: Persistent login sessions

### **Data Protection**
- **Row Level Security**: Database-level access control
- **Input Validation**: Form validation and sanitization
- **Error Handling**: Graceful error management
- **Secure Communication**: HTTPS and encrypted data

## 📱 Responsive Design

### **Mobile-First**
- **Breakpoints**: Tailored for all screen sizes
- **Touch-Friendly**: Optimized for mobile interactions
- **Performance**: Fast loading on all devices
- **Accessibility**: WCAG compliant design

## 🚀 Deployment

### **Build for Production**
```bash
npm run build
```

### **Environment Variables**
Ensure all environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **Deployment Platforms**
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative deployment option
- **Self-hosted**: Docker support available

## 🔄 Development Workflow

### **Code Organization**
- **Modular Structure**: Separated by feature and role
- **TypeScript**: Full type safety throughout
- **Component Reuse**: Shared UI components
- **Clean Architecture**: Separation of concerns

### **Database Migrations**
- **Version Control**: All schema changes tracked
- **Incremental Updates**: Safe database evolution
- **Rollback Support**: Migration history maintained

## 📈 Performance Optimizations

### **Frontend**
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js image optimization
- **Caching**: Efficient data caching strategies
- **Bundle Size**: Optimized dependencies

### **Backend**
- **Database Indexing**: Optimized query performance
- **Real-time Efficiency**: Minimal subscription overhead
- **Edge Functions**: Fast serverless execution
- **CDN**: Global content delivery

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Submit pull request with description

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Component Structure**: Reusable, maintainable components

## 📞 Support

### **Getting Help**
- **Documentation**: Comprehensive guides and examples
- **Support Tickets**: In-app support system
- **Community**: Developer community support
- **Issues**: GitHub issue tracking

### **Contact**
- **Platform Support**: Use in-app support tickets
- **Technical Issues**: Submit detailed bug reports
- **Feature Requests**: Suggest improvements

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase**: Backend infrastructure and real-time capabilities
- **Next.js**: React framework and development experience
- **Tailwind CSS**: Utility-first styling approach
- **Chart.js**: Data visualization library
- **shadcn/ui**: Component library and design system

---

**Built with ❤️ for a sustainable solar future in Pakistan** 🇵🇰

*SolarMarket - Connecting homeowners with solar energy solutions*