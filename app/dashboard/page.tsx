'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  DocumentTextIcon, 
  SunIcon, 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
  pendingQuotes: number;
  acceptedQuotes: number;
  unreadMessages: number;
}

export default function UserDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingQuotes: 0,
    acceptedQuotes: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardStats();
    }
  }, [profile]);

  const fetchDashboardStats = async () => {
    try {
      const [quotesResult, messagesResult] = await Promise.all([
        supabase.from('quotes').select('id, status').eq('user_id', profile?.id),
        supabase
          .from('messages')
          .select('id, is_read, conversation:conversations(user_id)')
          .eq('is_read', false)
      ]);

      const quotes = quotesResult.data || [];
      const messages = messagesResult.data || [];

      setStats({
        pendingQuotes: quotes.filter(q => q.status === 'pending').length,
        acceptedQuotes: quotes.filter(q => q.status === 'accepted').length,
        unreadMessages: messages.filter(m => 
          //@ts-ignore
          m.conversation?.user_id === profile?.id
        ).length
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Request Quote',
      description: 'Get solar installation quotes from sellers',
      icon: SunIcon,
      href: '/quotes/request',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'AI Assistant',
      description: 'Get instant help with solar questions',
      icon: ChatBubbleLeftRightIcon,
      href: '/ai-assistant',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Start Chat',
      description: 'Chat with solar installation experts',
      icon: ChatBubbleLeftRightIcon,
      href: '/chat',
      color: 'from-green-500 to-green-600'
    }
  ];

  const statCards = [
    {
      title: 'Pending Quotes',
      value: stats.pendingQuotes,
      icon: SunIcon,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Accepted Quotes',
      value: stats.acceptedQuotes,
      icon: SunIcon,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: ChatBubbleLeftRightIcon,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {profile?.full_name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your solar journey from your personalized dashboard
            </p>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loading ? '—' : card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Link
                  href={action.href}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group"
                >
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{action.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <Link
              href="/activity"
              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <SunIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">Quote request submitted</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <SunIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">New quote received from SolarPro</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">New message from installer</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}