/*
  # Create quotation system tables without RLS

  1. New Tables
    - `quotation_requests` - User requests for solar installation quotes
    - `quotation_responses` - Seller responses to user requests

  2. Features
    - Comprehensive user requirements tracking
    - Detailed seller quote responses
    - Status management for requests and responses
    - Support for appliances and specifications
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotation_requests_user_id ON quotation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quotation_requests_status ON quotation_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotation_requests_created_at ON quotation_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_quotation_responses_request_id ON quotation_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_quotation_responses_seller_id ON quotation_responses(seller_id);
CREATE INDEX IF NOT EXISTS idx_quotation_responses_status ON quotation_responses(status);
CREATE INDEX IF NOT EXISTS idx_quotation_responses_created_at ON quotation_responses(created_at);

-- Add unique constraint to prevent duplicate responses from same seller
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_seller_response 
ON quotation_responses(request_id, seller_id);