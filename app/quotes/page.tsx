'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase, QuotationRequest, QuotationResponse } from '@/lib/supabase';
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  LightBulbIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface RequestWithResponses extends QuotationRequest {
  responses: (QuotationResponse & { seller: { full_name: string; avatar_url?: string } })[];
}

export default function QuotesPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<RequestWithResponses[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithResponses | null>(null);

  useEffect(() => {
    if (profile) {
      fetchQuotationRequests();
    }
  }, [profile]);

  const fetchQuotationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('quotation_requests')
        .select(`
          *,
          responses:quotation_responses(
            *,
            seller:users(full_name, avatar_url)
          )
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching quotation requests:', error);
      toast.error('Failed to load quotation requests');
    } finally {
      setLoading(false);
    }
  };

  const acceptResponse = async (responseId: string) => {
    try {
      const { error } = await supabase
        .from('quotation_responses')
        .update({ status: 'accepted' })
        .eq('id', responseId);

      if (error) throw error;

      toast.success('Quote accepted successfully!');
      fetchQuotationRequests();
    } catch (error: any) {
      console.error('Error accepting quote:', error);
      toast.error('Failed to accept quote');
    }
  };

  const rejectResponse = async (responseId: string) => {
    try {
      const { error } = await supabase
        .from('quotation_responses')
        .update({ status: 'rejected' })
        .eq('id', responseId);

      if (error) throw error;

      toast.success('Quote rejected');
      fetchQuotationRequests();
    } catch (error: any) {
      console.error('Error rejecting quote:', error);
      toast.error('Failed to reject quote');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'closed':
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
      case 'expired':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getResponseStatusColor = (status: string) => {
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
    <ProtectedRoute allowedRoles={['user']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Quotation Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your solar quotation requests and manage responses from sellers
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link
              href="/quotes/request"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span>New Request</span>
            </Link>
          </motion.div>
        </div>

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
        ) : requests.length === 0 ? (
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
              No quotation requests yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start your solar journey by submitting your first quotation request
            </p>
            <Link
              href="/quotes/request"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105"
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span>Submit First Request</span>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {requests.map((request, index) => (
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
                      <div className="bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 p-2 rounded-lg">
                        <HomeIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Solar Installation Request
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Submitted {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  {/* Request Details */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">{request.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">House Size</p>
                      <p className="font-medium text-gray-900 dark:text-white">{request.house_dimensions_marla} Marla</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Lights & Fans</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.number_of_lights} lights, {request.number_of_fans} fans
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Avg Monthly Bill</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        PKR {request.avg_monthly_bill_amount?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Responses</p>
                      <p className="font-medium text-gray-900 dark:text-white">{request.responses?.length || 0} received</p>
                    </div>
                  </div>

                  {/* Appliances */}
                  {Object.keys(request.appliances || {}).length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Appliances:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(request.appliances || {}).map(([name, quantity]) => (
                          <span key={name} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                            {name} × {quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Responses */}
                {request.responses && request.responses.length > 0 && (
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Seller Responses ({request.responses.length})
                    </h4>
                    <div className="space-y-4">
                      {request.responses.map((response) => (
                        <div key={response.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {response.seller.full_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{response.seller.full_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{response.title}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResponseStatusColor(response.status)}`}>
                              {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                            </span>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Cost</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                PKR {response.estimated_cost.toLocaleString()}
                              </p>
                            </div>
                            {response.estimated_savings && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Savings</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                  PKR {response.estimated_savings.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {response.installation_timeline && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Timeline</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {response.installation_timeline}
                                </p>
                              </div>
                            )}
                          </div>

                          {response.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              {response.description}
                            </p>
                          )}

                          {response.status === 'pending' && (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => acceptResponse(response.id)}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center space-x-1"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                <span>Accept</span>
                              </button>
                              <button
                                onClick={() => rejectResponse(response.id)}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center space-x-1"
                              >
                                <XCircleIcon className="h-4 w-4" />
                                <span>Reject</span>
                              </button>
                              <Link
                                href={`/chat?seller=${response.seller_id}`}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
                              >
                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                <span>Chat</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Responses Yet */}
                {(!request.responses || request.responses.length === 0) && (
                  <div className="p-6 text-center">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Waiting for seller responses...
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}