import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  }
);


export type UserRole = 'user' | 'seller' | 'admin';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type RequestStatus = 'open' | 'closed' | 'expired';
export type ResponseStatus = 'pending' | 'accepted' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationRequest {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  house_dimensions_marla: number;
  number_of_lights: number;
  number_of_fans: number;
  avg_monthly_bill_amount?: number;
  appliances: Record<string, number>;
  additional_requirements?: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface QuotationResponse {
  id: string;
  request_id: string;
  seller_id: string;
  title: string;
  description?: string;
  estimated_cost: number;
  estimated_savings?: number;
  installation_timeline?: string;
  system_specifications: Record<string, any>;
  warranty_details?: string;
  status: ResponseStatus;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  specifications: Record<string, any>;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  seller_id: string;
  title: string;
  description?: string;
  estimated_cost: number;
  estimated_savings: number;
  installation_timeline?: string;
  products: any[];
  status: QuoteStatus;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationWithParticipants extends Conversation {
  user: { id: string; full_name: string; avatar_url?: string };
  seller: { id: string; full_name: string; avatar_url?: string };
  last_message?: { content: string; sender_id: string; created_at: string };
  unread_count: number;
}

export interface MessageWithSender extends Message {
  sender: { id: string; full_name: string; avatar_url?: string };
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  admin_response?: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
}