/*
  # Remove all RLS policies for development

  1. Security Changes
    - Disable RLS on all tables for development
    - Remove all existing RLS policies
    - Allow unrestricted access to all data

  2. Tables Affected
    - users
    - products
    - bills
    - quotes
    - conversations
    - messages
    - quotation_requests
    - quotation_responses

  Note: This is for development only. Re-enable RLS for production.
*/

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_responses DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Sellers can read user profiles for business" ON users;

DROP POLICY IF EXISTS "Anyone can read active products" ON products;
DROP POLICY IF EXISTS "Sellers can manage own products" ON products;

DROP POLICY IF EXISTS "Users can manage own bills" ON bills;

DROP POLICY IF EXISTS "Users can read own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON quotes;
DROP POLICY IF EXISTS "Sellers can update quotes they received" ON quotes;
DROP POLICY IF EXISTS "Users can update quotes they created" ON quotes;

DROP POLICY IF EXISTS "Users can read own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can read messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages they sent" ON messages;

DROP POLICY IF EXISTS "Users can read own quotation requests" ON quotation_requests;
DROP POLICY IF EXISTS "Users can create quotation requests" ON quotation_requests;
DROP POLICY IF EXISTS "Users can update own quotation requests" ON quotation_requests;
DROP POLICY IF EXISTS "Sellers can read all open quotation requests" ON quotation_requests;

DROP POLICY IF EXISTS "Users can read responses to their requests" ON quotation_responses;
DROP POLICY IF EXISTS "Sellers can read own responses" ON quotation_responses;
DROP POLICY IF EXISTS "Sellers can create responses" ON quotation_responses;
DROP POLICY IF EXISTS "Sellers can update own responses" ON quotation_responses;

-- Drop storage policies as well
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can delete own product images" ON storage.objects;