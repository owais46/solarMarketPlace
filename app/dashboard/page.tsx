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
  totalBills: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  unreadMessages: number;
}

export default function UserDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBills: 0,
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
      const [billsResult, quotesResult, messagesResult] = await Promise.all([
        supabase.from('bills').select('id').eq('user_id', profile?.id),
        supabase.from('quotes').select('id, status').eq('user_id', profile?.id),
        supabase
          .from('messages')
          .select('id, is_read, conversation:conversations(user_id)')
          .eq('is_read', false)
      ]);

      const quotes = quotesResult.data || [];
      const messages = messagesResult.data || [];

      setStats({
        totalBills: billsResult.data?.length || 0,
        pendingQuotes: quotes.filter(q => q.status === 'pending').length,
        acceptedQuotes: quotes.filter(q => q.status === 'accepted').length,
        unreadMessages: messages.filter(m => 
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
      title: 'Upload Bill',
      description: 'Upload your electricity bill for analysis',
      icon: CloudArrowUpIcon,
      href: '/bills/upload',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Request Quote',
      description: 'Get solar installation quotes from sellers',
      icon: SunIcon,
      href: '/quotes/request',
      color: 'from-orange-500 to-orange-600'
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
      title: 'Total Bills',
      value: stats.totalBills,
      icon: DocumentTextIcon,
      color: 'from-blue-500 to-blue-600'
    },
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {profile?.full_name}!
            </h1>
            <p className="text-gray-600">
              Manage your solar journey from your personalized dashboard
            </p>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Link
                  href={action.href}
                  className="block bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow group"
                >
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600">{action.description}</p>
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
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link
              href="/activity"
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-lg">
                <DocumentTextIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Bill uploaded successfully</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-lg">
                <SunIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New quote received from SolarPro</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-purple-100 p-2 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New message from installer</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}