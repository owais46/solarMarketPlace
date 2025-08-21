'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  UserGroupIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalQuotes: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeIssues: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalQuotes: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeIssues: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchAdminStats();
    }
  }, [profile]);

  const fetchAdminStats = async () => {
    try {
      const [usersResult, sellersResult, quotesResult] = await Promise.all([
        supabase.from('users').select('id').eq('role', 'user'),
        supabase.from('users').select('id').eq('role', 'seller'),
        supabase.from('quotes').select('id, status, estimated_cost')
      ]);

      const quotes = quotesResult.data || [];
      const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
      const totalRevenue = acceptedQuotes.reduce((sum, quote) => sum + (quote.estimated_cost || 0), 0);

      setStats({
        totalUsers: usersResult.data?.length || 0,
        totalSellers: sellersResult.data?.length || 0,
        totalQuotes: quotes.length,
        totalRevenue,
        pendingApprovals: quotes.filter(q => q.status === 'pending').length,
        activeIssues: 3 // Mock data for demo
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: UserGroupIcon,
      href: '/admin/users',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Seller Approvals',
      description: 'Review pending seller applications',
      icon: CheckCircleIcon,
      href: '/admin/sellers',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'System Reports',
      description: 'View platform analytics and reports',
      icon: ChartBarIcon,
      href: '/admin/reports',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Support Issues',
      description: 'Handle customer support tickets',
      icon: ExclamationTriangleIcon,
      href: '/admin/support',
      color: 'from-red-500 to-red-600'
    }
  ];

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'from-blue-500 to-blue-600',
      change: '+15 this week'
    },
    {
      title: 'Active Sellers',
      value: stats.totalSellers,
      icon: BuildingStorefrontIcon,
      color: 'from-green-500 to-green-600',
      change: '+3 this week'
    },
    {
      title: 'Total Quotes',
      value: stats.totalQuotes,
      icon: DocumentTextIcon,
      color: 'from-orange-500 to-orange-600',
      change: '+28 this week'
    },
    {
      title: 'Platform Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'from-purple-500 to-purple-600',
      change: '+18% this month'
    }
  ];

  const recentActivity = [
    {
      type: 'user_signup',
      message: 'New user registered: john.doe@email.com',
      time: '2 minutes ago',
      icon: UserGroupIcon,
      color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
    },
    {
      type: 'seller_approval',
      message: 'Seller application approved: SolarTech Solutions',
      time: '15 minutes ago',
      icon: CheckCircleIcon,
      color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
    },
    {
      type: 'quote_created',
      message: 'New quote request submitted',
      time: '1 hour ago',
      icon: DocumentTextIcon,
      color: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
    },
    {
      type: 'support_ticket',
      message: 'Support ticket created: Payment issue',
      time: '2 hours ago',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
    }
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {profile?.full_name}! Monitor and manage the SolarMarket platform.
            </p>
          </motion.div>
        </div>

        {/* Alert Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {stats.pendingApprovals} seller applications pending approval
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Review pending applications to maintain platform quality
              </p>
            </div>
            <Link
              href="/admin/sellers"
              className="ml-auto bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Review Now
            </Link>
          </div>
        </motion.div>

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{action.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity & System Health */}
        <div className="grid lg:grid-cols-2 gap-8">
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
                href="/admin/activity"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className={`p-2 rounded-lg ${activity.color}`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">System Health</h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Server Uptime</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">99.9%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Database Performance</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Excellent</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">API Response Time</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">120ms</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">0</p>
                <p className="text-xs text-green-700 dark:text-green-300">Critical Issues</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.activeIssues}</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">Active Tickets</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}