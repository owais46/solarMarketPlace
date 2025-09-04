'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
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

interface ReportData {
  userGrowth: {
    labels: string[];
    data: number[];
    growth: number;
  };
  quoteActivity: {
    labels: string[];
    data: number[];
    total: number;
  };
  revenue: {
    labels: string[];
    data: number[];
    total: number;
    growth: number;
  };
  userDistribution: {
    users: number;
    sellers: number;
  };
}

export default function AdminReportsPage() {
  const { profile } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    userGrowth: { labels: [], data: [], growth: 0 },
    quoteActivity: { labels: [], data: [], total: 0 },
    revenue: { labels: [], data: [], total: 0, growth: 0 },
    userDistribution: { users: 0, sellers: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      // Generate date range
      const dateRange = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return date;
      });

      const labels = dateRange.map(date => 
        date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      );

      // Fetch user growth data
      const userGrowthPromises = dateRange.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString());
        
        return count || 0;
      });

      // Fetch quote activity data
      const quoteActivityPromises = dateRange.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const { count } = await supabase
          .from('quotation_responses')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString());
        
        return count || 0;
      });

      // Fetch revenue data
      const revenuePromises = dateRange.map(async (date) => {
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

      // Fetch user distribution
      const [usersResult, sellersResult] = await Promise.all([
        supabase.from('users').select('id').eq('role', 'user'),
        supabase.from('users').select('id').eq('role', 'seller')
      ]);

      const [userGrowthData, quoteActivityData, revenueData] = await Promise.all([
        Promise.all(userGrowthPromises),
        Promise.all(quoteActivityPromises),
        Promise.all(revenuePromises)
      ]);

      // Calculate growth percentages
      const userGrowth = userGrowthData.reduce((sum, count) => sum + count, 0);
      const totalRevenue = revenueData.reduce((sum, amount) => sum + amount, 0);
      const totalQuotes = quoteActivityData.reduce((sum, count) => sum + count, 0);

      // Calculate growth compared to previous period (simplified)
      const currentPeriodUsers = userGrowthData.slice(-Math.floor(days/2)).reduce((sum, count) => sum + count, 0);
      const previousPeriodUsers = userGrowthData.slice(0, Math.floor(days/2)).reduce((sum, count) => sum + count, 0);
      const userGrowthPercentage = previousPeriodUsers > 0 
        ? Math.round(((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100)
        : currentPeriodUsers > 0 ? 100 : 0;

      const currentPeriodRevenue = revenueData.slice(-Math.floor(days/2)).reduce((sum, amount) => sum + amount, 0);
      const previousPeriodRevenue = revenueData.slice(0, Math.floor(days/2)).reduce((sum, amount) => sum + amount, 0);
      const revenueGrowthPercentage = previousPeriodRevenue > 0 
        ? Math.round(((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100)
        : currentPeriodRevenue > 0 ? 100 : 0;

      setReportData({
        userGrowth: {
          labels,
          data: userGrowthData,
          growth: userGrowthPercentage
        },
        quoteActivity: {
          labels,
          data: quoteActivityData,
          total: totalQuotes
        },
        revenue: {
          labels,
          data: revenueData,
          total: totalRevenue,
          growth: revenueGrowthPercentage
        },
        userDistribution: {
          users: usersResult.data?.length || 0,
          sellers: sellersResult.data?.length || 0
        }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['Date', 'New Users', 'Quotes', 'Revenue (PKR)'],
      ...reportData.userGrowth.labels.map((label, index) => [
        label,
        reportData.userGrowth.data[index],
        reportData.quoteActivity.data[index],
        reportData.revenue.data[index]
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solar-market-report-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Chart configurations
  const userGrowthChart = {
    labels: reportData.userGrowth.labels,
    datasets: [
      {
        label: 'New Users',
        data: reportData.userGrowth.data,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };

  const quoteActivityChart = {
    labels: reportData.quoteActivity.labels,
    datasets: [
      {
        label: 'Quotes',
        data: reportData.quoteActivity.data,
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1
      }
    ]
  };

  const revenueChart = {
    labels: reportData.revenue.labels,
    datasets: [
      {
        label: 'Revenue (PKR)',
        data: reportData.revenue.data,
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };

  const userDistributionChart = {
    labels: ['Users', 'Sellers'],
    datasets: [
      {
        data: [reportData.userDistribution.users, reportData.userDistribution.sellers],
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              System Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive analytics and insights for the SolarMarket platform
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center space-x-4 mt-4 sm:mt-0"
          >
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            
            <button
              onClick={exportReport}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Export</span>
            </button>
          </motion.div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User Growth</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : reportData.userGrowth.data.reduce((sum, count) => sum + count, 0)}
                </p>
              </div>
              <div className={`flex items-center space-x-1 ${
                reportData.userGrowth.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {reportData.userGrowth.growth >= 0 ? (
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">
                  {reportData.userGrowth.growth >= 0 ? '+' : ''}{reportData.userGrowth.growth}%
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : reportData.quoteActivity.total}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : `PKR ${reportData.revenue.total.toLocaleString()}`}
                </p>
              </div>
              <div className={`flex items-center space-x-1 ${
                reportData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {reportData.revenue.growth >= 0 ? (
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">
                  {reportData.revenue.growth >= 0 ? '+' : ''}{reportData.revenue.growth}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Growth Trend</h2>
            <div className="h-64">
              <Line data={userGrowthChart} options={chartOptions} />
            </div>
          </motion.div>

          {/* User Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Distribution</h2>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={userDistributionChart} />
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Quote Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quote Activity</h2>
            <div className="h-64">
              <Bar data={quoteActivityChart} options={chartOptions} />
            </div>
          </motion.div>

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Revenue Trend</h2>
            <div className="h-64">
              <Line data={revenueChart} options={chartOptions} />
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}