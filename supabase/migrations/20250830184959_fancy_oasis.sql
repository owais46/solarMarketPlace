/*
  # Fix conversations table missing updated_at column

  1. Changes
    - Add missing updated_at column to conversations table
    - Fix the trigger function to handle missing column
    - Ensure all chat functionality works properly

  2. Tables Modified
    - conversations: Add updated_at column with default value
*/

-- Add missing updated_at column to conversations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing conversations to have updated_at value
UPDATE conversations 
SET updated_at = last_message_at 
WHERE updated_at IS NULL;

-- Recreate the trigger function to handle updated_at properly
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();