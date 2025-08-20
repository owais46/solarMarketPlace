/*
  # Solar Marketplace Database Schema

  1. New Tables
    - `users` - Store user profiles with role-based access
    - `products` - Seller product catalog
    - `bills` - User uploaded bills with extracted text
    - `quotes` - Solar quotes between users and sellers
    - `messages` - Chat messages between users and sellers
    - `conversations` - Chat conversations tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure user data with proper authentication
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');
CREATE TYPE quote_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role DEFAULT 'user',
  phone text,
  address text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table for sellers
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2),
  category text,
  specifications jsonb DEFAULT '{}',
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bills table for user uploads
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  extracted_text text,
  bill_amount decimal(10,2),
  utility_provider text,
  bill_date date,
  created_at timestamptz DEFAULT now()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  estimated_cost decimal(10,2),
  estimated_savings decimal(10,2),
  installation_timeline text,
  products jsonb DEFAULT '[]',
  status quote_status DEFAULT 'pending',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Products policies
CREATE POLICY "Anyone can read active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can manage own products" ON products
  FOR ALL USING (seller_id = auth.uid());

CREATE POLICY "Admin can manage all products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bills policies
CREATE POLICY "Users can manage own bills" ON bills
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admin can read all bills" ON bills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Quotes policies
CREATE POLICY "Users can read own quotes" ON quotes
  FOR SELECT USING (user_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create quotes" ON quotes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sellers can update quotes they received" ON quotes
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Users can update quotes they created" ON quotes
  FOR UPDATE USING (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid() OR seller_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can read messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (user_id = auth.uid() OR seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (user_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_quotes_user_seller ON quotes(user_id, seller_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_conversations_users ON conversations(user_id, seller_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);