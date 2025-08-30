/*
  # Remove bills functionality and add average monthly bill amount

  1. Changes
    - Drop bills table and related storage policies
    - Add avg_monthly_bill_amount to quotation_requests table
    - Remove bill-related indexes and constraints

  2. New Fields
    - avg_monthly_bill_amount: decimal field for 12-month average bill amount
    - Updated quotation_requests table structure

  3. Cleanup
    - Remove bills table completely
    - Clean up any bill-related storage policies
*/

-- Drop bills table if it exists
DROP TABLE IF EXISTS bills CASCADE;

-- Add average monthly bill amount to quotation requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotation_requests' AND column_name = 'avg_monthly_bill_amount'
  ) THEN
    ALTER TABLE quotation_requests ADD COLUMN avg_monthly_bill_amount decimal(10,2);
  END IF;
END $$;

-- Drop any bill-related storage policies if they exist
DROP POLICY IF EXISTS "Users can upload bills" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own bills" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for bills" ON storage.objects;

-- Remove bills bucket if it exists
DELETE FROM storage.buckets WHERE id = 'bills';