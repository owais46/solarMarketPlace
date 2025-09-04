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
  ClockIcon,
  ServerIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalQuotes: number;
  totalRevenue: number;
  activeProducts: number;
  systemHealth: number;
}

interface ChartData {
  userGrowth: number[];
  quoteActivity: number[];
  revenueData: number[];
  labels: string[];
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalQuotes: 0,
    totalRevenue: 0,
    activeProducts: 0,
    systemHealth: 98
  });
  const [chartData, setChartData] = useState<ChartData>({
    userGrowth: [],
    quoteActivity: [],
    revenueData: [],
    labels: []
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchAdminStats();
      fetchChartData();
      fetchRecentActivity();
    }
  }, [profile]);

  const fetchAdminStats = async () => {
    try {
      const [usersResult, sellersResult, quotesResult, productsResult] = await Promise.all([
        supabase.from('users').select('id').eq('role', 'user'),
        supabase.from('users').select('id').eq('role', 'seller'),
        supabase.from('quotation_responses').select('id, status, estimated_cost'),
        supabase.from('products').select('id').eq('is_active', true)
      ]);

      const quotes = quotesResult.data || [];
      const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
      const totalRevenue = acceptedQuotes.reduce((sum, quote) => sum + (quote.estimated_cost || 0), 0);

      setStats({
        totalUsers: usersResult.data?.length || 0,
        totalSellers: sellersResult.data?.length || 0,
        totalQuotes: quotes.length,
        totalRevenue,
        activeProducts: productsResult.data?.length || 0,
        systemHealth: 98
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      // Get last 7 days data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const labels = last7Days.map(date => 
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );

      // Fetch user registrations by day
      const userGrowthPromises = last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString());
        
        return count || 0;
      });

      // Fetch quote activity by day
      const quoteActivityPromises = last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const { count } = await supabase
          .from('quotation_responses')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString());
        
        return count || 0;
      });

      // Fetch revenue by day
      const revenuePromises = last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const { data } = await supabase
          .from('quotation_responses')
          .select('estimated_cost')
          .eq('status', 'accepted')
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString());
        
        return (data || []).reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
      });

      const [userGrowth, quoteActivity, revenueData] = await Promise.all([
        Promise.all(userGrowthPromises),
        Promise.all(quoteActivityPromises),
        Promise.all(revenuePromises)
      ]);

      setChartData({
        userGrowth,
        quoteActivity,
        revenueData,
        labels
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Get recent user registrations
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent quotes
      const { data: recentQuotes } = await supabase
        .from('quotation_responses')
        .select(`
          id, 
          status, 
          estimated_cost, 
          created_at,
          seller:users!seller_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent products
      const { data: recentProducts } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          created_at,
          seller:users!seller_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(2);

      // Combine activities
      const activities = [
        ...(recentUsers || []).map(user => ({
          type: 'user_signup',
          message: `${user.full_name} joined as ${user.role}`,
          time: user.created_at,
          icon: UserGroupIcon,
          color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
        })),
        ...(recentQuotes || []).map(quote => ({
          type: 'quote_activity',
          message: `Quote ${quote.status} by ${quote.seller?.full_name || 'seller'} (PKR ${quote.estimated_cost?.toLocaleString()})`,
          time: quote.created_at,
          icon: DocumentTextIcon,
          color: quote.status === 'accepted' 
            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
            : 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
        })),
        ...(recentProducts || []).map(product => ({
          type: 'product_added',
          message: `${product.seller?.full_name || 'Seller'} added "${product.name}"`,
          time: product.created_at,
          icon: BuildingStorefrontIcon,
          color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
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

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: UserGroupIcon,
      href: '/admin/users',
      color: 'from-blue-500 to-blue-600'
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
      value: `PKR ${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'from-purple-500 to-purple-600',
      change: '+18% this month'
    }
  ];

  // Chart configurations
  const userGrowthChart = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'New Users',
        data: chartData.userGrowth,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };

  const quoteActivityChart = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Quotes',
        data: chartData.quoteActivity,
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1
      }
    ]
  };

  const userTypeChart = {
    labels: ['Users', 'Sellers'],
    datasets: [
      {
        data: [stats.totalUsers, stats.totalSellers],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

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

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Growth (Last 7 Days)</h2>
            <div className="h-64">
              <Line data={userGrowthChart} options={chartOptions} />
            </div>
          </motion.div>

          {/* User Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Distribution</h2>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={userTypeChart} />
            </div>
          </motion.div>
        </div>

        {/* Quote Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quote Activity (Last 7 Days)</h2>
          <div className="h-64">
            <Bar data={quoteActivityChart} options={chartOptions} />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Actions</h2>
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
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-3 p-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded mb-1"></div>
                        <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`p-2 rounded-lg ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(activity.time)}</p>
                    </div>
                  </div>
                ))
              )}
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
                <div className="flex items-center justify-center mb-1">
                  <ServerIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.activeProducts}</p>
                <p className="text-xs text-green-700 dark:text-green-300">Active Products</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <CpuChipIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.systemHealth}%</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">System Health</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}