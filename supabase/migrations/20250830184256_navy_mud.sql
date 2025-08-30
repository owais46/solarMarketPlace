/*
  # Fix chat system with proper RLS policies

  1. Security
    - Enable RLS on conversations and messages tables
    - Add policies for users and sellers to access their conversations
    - Add policies for sending and reading messages

  2. Functions
    - Add trigger to update conversation last_message_at
    - Ensure proper conversation management
*/

-- Enable RLS on chat tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid() OR seller_id = auth.uid());

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

CREATE POLICY "Users can update messages they sent" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Function to update conversation last_message_at (recreate if exists)
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

-- Create trigger to automatically update last_message_at
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();