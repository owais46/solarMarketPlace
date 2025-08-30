/*
  # Enable real-time functionality for chat system

  1. Real-time Setup
    - Enable real-time on conversations table
    - Enable real-time on messages table
    - Configure publication for real-time updates

  2. Features
    - Real-time message delivery
    - Live conversation updates
    - Instant notification of new messages
    - Auto-refresh conversation list
*/

-- Enable real-time on conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable real-time on messages table  
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Ensure tables are properly configured for real-time
-- This allows Supabase to broadcast changes to subscribed clients