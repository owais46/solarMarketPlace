'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ConversationWithParticipants } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface ConversationListProps {
  conversations: ConversationWithParticipants[];
  selectedConversation: ConversationWithParticipants | null;
  onSelectConversation: (conversation: ConversationWithParticipants) => void;
  currentUserRole: 'user' | 'seller' | 'admin';
  loading: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUserRole,
  loading
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getOtherParticipant = (conversation: ConversationWithParticipants) => {
    return currentUserRole === 'user' ? conversation.seller : conversation.user;
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
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
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
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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
              {currentUserRole === 'user' 
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
                  onClick={() => onSelectConversation(conversation)}
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
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                        {currentUserRole === 'user' ? (
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
                          {conversation.last_message.sender_id === currentUserRole ? 'You: ' : ''}
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
  );
}