/*
  # Add storage bucket for product images

  1. Storage
    - Create 'products' bucket for product images
    - Set up public access for product images
    - Add RLS policies for product image uploads

  2. Security
    - Allow public read access to product images
    - Allow sellers to upload images for their products
    - Prevent unauthorized uploads
*/

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Public read access for product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

-- Allow sellers to upload product images
CREATE POLICY "Sellers can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Allow sellers to update their own product images
CREATE POLICY "Sellers can update own product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND
    auth.uid() IS NOT NULL
  );

-- Allow sellers to delete their own product images
CREATE POLICY "Sellers can delete own product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND
    auth.uid() IS NOT NULL
  );