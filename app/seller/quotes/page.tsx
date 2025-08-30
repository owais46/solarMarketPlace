'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase, QuotationRequest } from '@/lib/supabase';
import { 
  DocumentTextIcon,
  HomeIcon,
  LightBulbIcon,
  CpuChipIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface RequestWithUser extends QuotationRequest {
  user: { full_name: string; avatar_url?: string };
  response_count: number;
  my_response?: { id: string; status: string; estimated_cost: number };
}

export default function SellerQuotesPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'responded'>('all');

  useEffect(() => {
    if (profile) {
      fetchQuotationRequests();
    }
  }, [profile]);

  const fetchQuotationRequests = async () => {
    try {
      // First get all open requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('quotation_requests')
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Then get response counts and my responses for each request
      const requestsWithResponses = await Promise.all(
        (requestsData || []).map(async (request) => {
          // Get total response count
          const { count } = await supabase
            .from('quotation_responses')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', request.id);

          // Get my response if exists
          const { data: myResponse } = await supabase
            .from('quotation_responses')
            .select('id, status, estimated_cost')
            .eq('request_id', request.id)
            .eq('seller_id', profile?.id)
            .single();

          return {
            ...request,
            response_count: count || 0,
            my_response: myResponse
          };
        })
      );

      setRequests(requestsWithResponses);
    } catch (error: any) {
      console.error('Error fetching quotation requests:', error);
      toast.error('Failed to load quotation requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    switch (filter) {
      case 'new':
        return !request.my_response;
      case 'responded':
        return !!request.my_response;
      default:
        return true;
    }
  });

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
              Customer Quotation Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review customer requirements and submit your solar installation quotes
            </p>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex space-x-4">
            {[
              { key: 'all', label: 'All Requests', count: requests.length },
              { key: 'new', label: 'New Requests', count: requests.filter(r => !r.my_response).length },
              { key: 'responded', label: 'My Responses', count: requests.filter(r => !!r.my_response).length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <div className="animate-pulse">
                  <div className="bg-gray-300 dark:bg-gray-600 h-6 rounded mb-4"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-2/3 mb-2"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center py-12"
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <DocumentTextIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filter === 'new' ? 'No new requests' : filter === 'responded' ? 'No responses yet' : 'No requests available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'new' 
                ? 'Check back later for new customer requests'
                : filter === 'responded'
                ? 'You haven\'t responded to any requests yet'
                : 'No customer requests are currently available'
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                {/* Request Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {request.user.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.user.full_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {request.response_count} responses
                      </span>
                      {request.my_response && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.my_response.status)}`}>
                          My Quote: {request.my_response.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{request.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{request.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{request.address}</p>
                    </div>
                  </div>

                  {/* House Details */}
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">House Size</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{request.house_dimensions_marla} Marla</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Lights</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{request.number_of_lights}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fans</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{request.number_of_fans}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Appliances</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {Object.keys(request.appliances || {}).length} types
                      </p>
                    </div>
                  </div>

                  {/* Appliances Details */}
                  {Object.keys(request.appliances || {}).length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appliances:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(request.appliances || {}).map(([name, quantity]) => (
                          <span key={name} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                            {name} × {quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Requirements */}
                  {request.additional_requirements && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Requirements:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        {request.additional_requirements}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {request.my_response ? (
                      <>
                        <Link
                          href={`/seller/quotes/${request.id}/edit-response`}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Edit Quote (${request.my_response.estimated_cost.toLocaleString()})</span>
                        </Link>
                        <Link
                          href={`/chat?user=${request.user_id}`}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center space-x-1"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          <span>Chat</span>
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/seller/quotes/${request.id}/respond`}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 flex items-center space-x-1"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Submit Quote</span>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quote Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{requests.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {requests.filter(r => !r.my_response).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">New Opportunities</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {requests.filter(r => r.my_response?.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Quotes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {requests.filter(r => r.my_response?.status === 'accepted').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Accepted</p>
            </div>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}