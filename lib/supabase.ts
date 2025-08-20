import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'user' | 'seller' | 'admin';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

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

export interface Bill {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  extracted_text?: string;
  bill_amount?: number;
  utility_provider?: string;
  bill_date?: string;
  created_at: string;
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