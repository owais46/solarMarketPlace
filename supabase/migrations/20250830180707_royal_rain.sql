/*
  # Update quotation system for detailed requirements

  1. New Tables
    - `quotation_requests` - Detailed user requirements for solar installations
    - `quotation_responses` - Seller responses to user requests

  2. Changes
    - Add comprehensive fields for house details and appliances
    - Support for multiple seller responses per request
    - Status tracking for requests and responses

  3. Security
    - Enable RLS on new tables
    - Add policies for users and sellers
*/

-- Create quotation requests table
CREATE TABLE IF NOT EXISTS quotation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  house_dimensions_marla decimal(5,2) NOT NULL,
  number_of_lights integer DEFAULT 0,
  number_of_fans integer DEFAULT 0,
  appliances jsonb DEFAULT '{}',
  additional_requirements text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quotation responses table
CREATE TABLE IF NOT EXISTS quotation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES quotation_requests(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  estimated_cost decimal(10,2) NOT NULL,
  estimated_savings decimal(10,2),
  installation_timeline text,
  system_specifications jsonb DEFAULT '{}',
  warranty_details text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_responses ENABLE ROW LEVEL SECURITY;

-- Quotation requests policies
CREATE POLICY "Users can read own quotation requests" ON quotation_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create quotation requests" ON quotation_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quotation requests" ON quotation_requests
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Sellers can read all open quotation requests" ON quotation_requests
  FOR SELECT USING (
    status = 'open' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'seller'
    )
  );

-- Quotation responses policies
CREATE POLICY "Users can read responses to their requests" ON quotation_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotation_requests 
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can read own responses" ON quotation_responses
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can create responses" ON quotation_responses
  FOR INSERT WITH CHECK (
    seller_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'seller'
    )
  );

CREATE POLICY "Sellers can update own responses" ON quotation_responses
  FOR UPDATE USING (seller_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_quotation_requests_user_id ON quotation_requests(user_id);
CREATE INDEX idx_quotation_requests_status ON quotation_requests(status);
CREATE INDEX idx_quotation_responses_request_id ON quotation_responses(request_id);
CREATE INDEX idx_quotation_responses_seller_id ON quotation_responses(seller_id);
CREATE INDEX idx_quotation_responses_status ON quotation_responses(status);