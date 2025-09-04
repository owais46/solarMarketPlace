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
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState({
    responseRate: 0,
    satisfaction: 4.8,
    growth: 0
  });

  useEffect(() => {
    if (profile) {
      fetchSellerStats();
      fetchRecentQuotes();
      fetchPerformanceData();
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

  const fetchRecentQuotes = async () => {
    try {
      const { data: responses } = await supabase
        .from('quotation_responses')
        .select(`
          id,
          status,
          estimated_cost,
          created_at,
          request:quotation_requests(
            user:users(full_name)
          )
        `)
        .eq('seller_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setRecentQuotes(responses || []);
    } catch (error) {
      console.error('Error fetching recent quotes:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      // Get all seller's responses for calculations
      const { data: allResponses } = await supabase
        .from('quotation_responses')
        .select('status, created_at')
        .eq('seller_id', profile?.id);

      if (allResponses && allResponses.length > 0) {
        // Calculate response rate (accepted / total)
        const acceptedCount = allResponses.filter(r => r.status === 'accepted').length;
        const responseRate = Math.round((acceptedCount / allResponses.length) * 100);

        // Calculate growth (responses this month vs last month)
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        const thisMonthCount = allResponses.filter(r => 
          new Date(r.created_at) >= thisMonth
        ).length;
        
        const lastMonthCount = allResponses.filter(r => {
          const date = new Date(r.created_at);
          return date >= lastMonth && date < thisMonth;
        }).length;
        
        const growth = lastMonthCount > 0 
          ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
          : thisMonthCount > 0 ? 100 : 0;

        setPerformanceData({
          responseRate,
          satisfaction: 4.8, // This could be calculated from reviews if you have them
          growth
        });
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
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
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                    <div className="bg-gray-300 dark:bg-gray-600 w-8 h-8 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded mb-1"></div>
                      <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-32"></div>
                    </div>
                    <div className="bg-gray-300 dark:bg-gray-600 w-16 h-6 rounded-full"></div>
                  </div>
                ))
              ) : recentQuotes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">No recent quotes</p>
                </div>
              ) : (
                recentQuotes.map((quote) => (
                  <div key={quote.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      quote.status === 'accepted' ? 'bg-green-100 dark:bg-green-900' :
                      quote.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900' :
                      'bg-blue-100 dark:bg-blue-900'
                    }`}>
                      {quote.status === 'accepted' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : quote.status === 'pending' ? (
                        <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <SunIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {quote.status === 'accepted' ? 'Quote accepted by' : 
                         quote.status === 'pending' ? 'Quote pending for' : 
                         'Quote sent to'} {quote.request?.user?.full_name || 'Customer'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PKR {quote.estimated_cost?.toLocaleString()} - {formatTimeAgo(quote.created_at)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(quote.status)}`}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </span>
                  </div>
                ))
              )}
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
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Quote Acceptance Rate</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {loading ? '—' : `${performanceData.responseRate}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${performanceData.responseRate}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer Satisfaction</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {loading ? '—' : `${performanceData.satisfaction}/5`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${(performanceData.satisfaction / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Growth</span>
                  <span className={`text-sm font-bold ${
                    performanceData.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {loading ? '—' : `${performanceData.growth >= 0 ? '+' : ''}${performanceData.growth}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      performanceData.growth >= 0 
                        ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
                        : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${Math.min(Math.abs(performanceData.growth), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                💡 Pro Tip
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {performanceData.responseRate < 50 
                  ? 'Improve your quote acceptance rate by providing detailed specifications and competitive pricing!'
                  : performanceData.responseRate < 80
                  ? 'Great job! Respond to quotes within 2 hours to increase your acceptance rate even more!'
                  : 'Excellent acceptance rate! Keep up the great work with detailed and competitive quotes!'
                }
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}