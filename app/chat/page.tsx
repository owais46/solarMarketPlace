'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase, ConversationWithParticipants, MessageWithSender } from '@/lib/supabase';
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithParticipants | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      fetchConversations();
      
      // Check for URL parameters to start a conversation
      const sellerId = searchParams.get('seller');
      const userId = searchParams.get('user');
      
      if (sellerId && profile.role === 'user') {
        startConversationWithSeller(sellerId);
      } else if (userId && profile.role === 'seller') {
        startConversationWithUser(userId);
      }
    }
  }, [profile, searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user:users!conversations_user_id_fkey(id, full_name, avatar_url),
          seller:users!conversations_seller_id_fkey(id, full_name, avatar_url)
        `)
        .or(`user_id.eq.${profile?.id},seller_id.eq.${profile?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Fetch last message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', profile?.id);

          return {
            ...conv,
            last_message: lastMessage,
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', profile?.id);
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  };

  const startConversationWithSeller = async (sellerId: string) => {
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('seller_id', sellerId)
        .single();

      if (existingConv) {
        // Find and select existing conversation
        const conv = conversations.find(c => c.id === existingConv.id);
        if (conv) {
          setSelectedConversation(conv);
        }
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert([{
          user_id: profile?.id,
          seller_id: sellerId
        }])
        .select(`
          *,
          user:users!conversations_user_id_fkey(id, full_name, avatar_url),
          seller:users!conversations_seller_id_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      const newConversation = { ...newConv, unread_count: 0 };
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const startConversationWithUser = async (userId: string) => {
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('seller_id', profile?.id)
        .single();

      if (existingConv) {
        // Find and select existing conversation
        const conv = conversations.find(c => c.id === existingConv.id);
        if (conv) {
          setSelectedConversation(conv);
        }
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert([{
          user_id: userId,
          seller_id: profile?.id
        }])
        .select(`
          *,
          user:users!conversations_user_id_fkey(id, full_name, avatar_url),
          seller:users!conversations_seller_id_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      const newConversation = { ...newConv, unread_count: 0 };
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_id: profile?.id,
          content: newMessage.trim()
        }])
        .select(`
          *,
          sender:users(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      // Update conversation in the list
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { 
              ...conv, 
              last_message: { 
                content: newMessage.trim(), 
                sender_id: profile?.id || '', 
                created_at: new Date().toISOString() 
              },
              last_message_at: new Date().toISOString()
            }
          : conv
      ));
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherParticipant = (conversation: ConversationWithParticipants) => {
    return profile?.role === 'user' ? conversation.seller : conversation.user;
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = getOtherParticipant(conv);
    return otherParticipant.full_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['user', 'seller']}>
      <div className="h-[calc(100vh-4rem)] flex bg-white dark:bg-gray-900">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Messages</h1>
            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-3 p-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded mb-2"></div>
                        <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {searchTerm ? 'No conversations found' : 'No conversations yet'}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  {profile?.role === 'user' 
                    ? 'Start chatting with sellers from product pages'
                    : 'Customers will reach out to you through quotes'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredConversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  const isSelected = selectedConversation?.id === conversation.id;
                  
                  return (
                    <motion.div
                      key={conversation.id}
                      whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-r-2 border-orange-500' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={otherParticipant.avatar_url} alt={otherParticipant.full_name} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-sm font-semibold">
                              {otherParticipant.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Role indicator */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                            {profile?.role === 'user' ? (
                              <BuildingStorefrontIcon className="h-2.5 w-2.5 text-orange-500" />
                            ) : (
                              <UserIcon className="h-2.5 w-2.5 text-blue-500" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {otherParticipant.full_name}
                            </p>
                            <div className="flex items-center space-x-2">
                              {conversation.unread_count > 0 && (
                                <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                                  {conversation.unread_count}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(conversation.last_message_at)}
                              </span>
                            </div>
                          </div>
                          
                          {conversation.last_message && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                              {conversation.last_message.sender_id === profile?.id ? 'You: ' : ''}
                              {conversation.last_message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={getOtherParticipant(selectedConversation).avatar_url} 
                      alt={getOtherParticipant(selectedConversation).full_name} 
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-sm font-semibold">
                      {getOtherParticipant(selectedConversation).full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {getOtherParticipant(selectedConversation).full_name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {profile?.role === 'user' ? 'Solar Seller' : 'Customer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                <AnimatePresence>
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === profile?.id;
                    
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isOwnMessage && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={message.sender.avatar_url} alt={message.sender.full_name} />
                              <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-600 text-white text-xs">
                                {message.sender.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage 
                                ? 'text-orange-100' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <form onSubmit={sendMessage} className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* No Conversation Selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}