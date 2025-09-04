'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  CubeIcon,
  SunIcon, 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SellerStats {
  totalProducts: number;
  activeQuotes: number;
  completedSales: number;
  totalRevenue: number;
  unreadMessages: number;
}

export default function SellerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<SellerStats>({
    totalProducts: 0,
    activeQuotes: 0,
    completedSales: 0,
    totalRevenue: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchSellerStats();
    }
  }, [profile]);

  const fetchSellerStats = async () => {
    try {
      const [productsResult, quotationResponsesResult, messagesResult] = await Promise.all([
        // Get seller's products
        supabase.from('products').select('id').eq('seller_id', profile?.id),
        // Get seller's quotation responses
        supabase
          .from('quotation_responses')
          .select('id, status, estimated_cost')
          .eq('seller_id', profile?.id),
        // Get unread messages in conversations where seller is participant
        supabase
          .from('messages')
          .select(`
            id, 
            is_read, 
            sender_id,
            conversation:conversations!inner(user_id, seller_id)
          `)
          .eq('is_read', false)
          .neq('sender_id', profile?.id)
          .eq('conversation.seller_id', profile?.id)
      ]);

      const responses = quotationResponsesResult.data || [];
      const messages = messagesResult.data || [];
      const completedSales = responses.filter(r => r.status === 'accepted');
      const totalRevenue = completedSales.reduce((sum, response) => sum + (response.estimated_cost || 0), 0);

      setStats({
        totalProducts: productsResult.data?.length || 0,
        activeQuotes: responses.filter(r => r.status === 'pending').length,
        completedSales: completedSales.length,
        totalRevenue,
        unreadMessages: messages.length
      });
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add Product',
      description: 'Add new solar products to your catalog',
      icon: PlusIcon,
      href: '/seller/products/new',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'View Quotes',
      description: 'Manage customer quote requests',
      icon: EyeIcon,
      href: '/seller/quotes',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Customer Chat',
      description: 'Communicate with potential customers',
      icon: ChatBubbleLeftRightIcon,
      href: '/chat',
      color: 'from-green-500 to-green-600'
    }
  ];

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: CubeIcon,
      color: 'from-blue-500 to-blue-600',
      change: '+2 this month'
    },
    {
      title: 'Active Quotes',
      value: stats.activeQuotes,
      icon: ClockIcon,
      color: 'from-yellow-500 to-yellow-600',
      change: '+5 this week'
    },
    {
      title: 'Completed Sales',
      value: stats.completedSales,
      icon: CheckCircleIcon,
      color: 'from-green-500 to-green-600',
      change: '+3 this month'
    },
    {
      title: 'Total Revenue',
      value: `PKR ${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'from-purple-500 to-purple-600',
      change: '+12% this month'
    }
  ];

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Seller Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {profile?.full_name}! Manage your solar business from here.
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {card.change}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : card.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
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

        {/* Recent Activity & Performance */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Quotes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Quote Requests</h2>
              <Link
                href="/seller/quotes"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                  <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">New quote request from John Smith</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Residential solar system - 2 hours ago</p>
                </div>
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">Quote accepted by Sarah Johnson</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Commercial installation - 5 hours ago</p>
                </div>
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                  Accepted
                </span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <SunIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">Quote sent to Mike Davis</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rooftop solar panels - 1 day ago</p>
                </div>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                  Sent
                </span>
              </div>
            </div>
          </motion.div>

          {/* Performance Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance Overview</h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Quote Response Rate</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">85%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer Satisfaction</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">4.8/5</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Growth</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">+12%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                💡 Pro Tip
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Respond to quotes within 2 hours to increase your acceptance rate by 40%!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}