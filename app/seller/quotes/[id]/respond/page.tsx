'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase, QuotationRequest } from '@/lib/supabase';
import { 
  DocumentTextIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ResponseForm {
  title: string;
  description: string;
  estimatedCost: string;
  estimatedSavings: string;
  installationTimeline: string;
  systemSpecifications: Record<string, string>;
  warrantyDetails: string;
  expiresAt: string;
}

interface RequestWithUser extends QuotationRequest {
  user: { full_name: string; email: string };
}

export default function RespondToQuotePage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [request, setRequest] = useState<RequestWithUser | null>(null);
  const [formData, setFormData] = useState<ResponseForm>({
    title: '',
    description: '',
    estimatedCost: '',
    estimatedSavings: '',
    installationTimeline: '',
    systemSpecifications: {},
    warrantyDetails: '',
    expiresAt: ''
  });
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  useEffect(() => {
    if (params.id && profile) {
      fetchRequest();
    }
  }, [params.id, profile]);

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('quotation_requests')
        .select(`
          *,
          user:users(full_name, email)
        `)
        .eq('id', params.id)
        .eq('status', 'open')
        .single();

      if (error) throw error;

      // Check if we already responded
      const { data: existingResponse } = await supabase
        .from('quotation_responses')
        .select('id')
        .eq('request_id', params.id)
        .eq('seller_id', profile?.id)
        .single();

      if (existingResponse) {
        toast.error('You have already responded to this request');
        router.push('/seller/quotes');
        return;
      }

      setRequest(data);
      
      // Set default expiry to 30 days from now
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        expiresAt: defaultExpiry.toISOString().split('T')[0]
      }));
    } catch (error: any) {
      console.error('Error fetching request:', error);
      toast.error('Failed to load request');
      router.push('/seller/quotes');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.estimatedCost) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('quotation_responses')
        .insert([
          {
            request_id: params.id,
            seller_id: profile?.id,
            title: formData.title,
            description: formData.description,
            estimated_cost: parseFloat(formData.estimatedCost),
            estimated_savings: formData.estimatedSavings ? parseFloat(formData.estimatedSavings) : null,
            installation_timeline: formData.installationTimeline,
            system_specifications: formData.systemSpecifications,
            warranty_details: formData.warrantyDetails,
            expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
          }
        ]);

      if (error) throw error;

      toast.success('Quote submitted successfully!');
      router.push('/seller/quotes');
    } catch (error: any) {
      console.error('Error submitting quote:', error);
      toast.error('Failed to submit quote');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addSpecification = () => {
    if (newSpecKey && newSpecValue) {
      setFormData({
        ...formData,
        systemSpecifications: {
          ...formData.systemSpecifications,
          [newSpecKey]: newSpecValue
        }
      });
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...formData.systemSpecifications };
    delete newSpecs[key];
    setFormData({
      ...formData,
      systemSpecifications: newSpecs
    });
  };

  if (initialLoading) {
    return (
      <ProtectedRoute allowedRoles={['seller']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!request) {
    return (
      <ProtectedRoute allowedRoles={['seller']}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              The quotation request you're looking for doesn't exist or is no longer available.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Submit Solar Quote
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Provide a detailed quote for {request.user.full_name}'s solar installation requirements
          </p>
        </motion.div>

        {/* Customer Requirements Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8 border border-blue-200 dark:border-blue-800"
        >
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">Customer Requirements</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">House Size</p>
              <p className="font-semibold text-blue-900 dark:text-blue-100">{request.house_dimensions_marla} Marla</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Lights</p>
              <p className="font-semibold text-blue-900 dark:text-blue-100">{request.number_of_lights}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Fans</p>
              <p className="font-semibold text-blue-900 dark:text-blue-100">{request.number_of_fans}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Avg Monthly Bill</p>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                ${request.avg_monthly_bill_amount?.toLocaleString() || 'N/A'}
              </p>
            </div>
          </div>
          
          {Object.keys(request.appliances || {}).length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Appliances:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(request.appliances || {}).map(([name, quantity]) => (
                  <span key={name} className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                    {name} × {quantity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Quote Form */}
        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-8 border border-gray-100 dark:border-gray-700"
          >
            {/* Quote Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-orange-500" />
                Quote Details
              </h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quote Title *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Complete Solar System for 5 Marla House"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe your proposed solar solution, installation process, and benefits..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Timeline */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-orange-500" />
                Pricing & Timeline
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Cost (PKR) *
                  </label>
                  <input
                    id="estimatedCost"
                    name="estimatedCost"
                    type="number"
                    step="0.01"
                    required
                    value={formData.estimatedCost}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="estimatedSavings" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Savings (PKR)
                  </label>
                  <input
                    id="estimatedSavings"
                    name="estimatedSavings"
                    type="number"
                    step="0.01"
                    value={formData.estimatedSavings}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="installationTimeline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Installation Timeline
                  </label>
                  <select
                    id="installationTimeline"
                    name="installationTimeline"
                    value={formData.installationTimeline}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select timeline</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="2-4 weeks">2-4 weeks</option>
                    <option value="1-2 months">1-2 months</option>
                    <option value="2-3 months">2-3 months</option>
                    <option value="3+ months">3+ months</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quote Expires On
                  </label>
                  <input
                    id="expiresAt"
                    name="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* System Specifications */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-orange-500" />
                System Specifications
              </h2>
              
              <div className="space-y-4">
                {/* Add Specification */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Specification name (e.g., Panel Type)"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Value (e.g., Monocrystalline)"
                    />
                    <button
                      type="button"
                      onClick={addSpecification}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Specifications List */}
                {Object.entries(formData.systemSpecifications).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">System Specifications:</h3>
                    <div className="space-y-2">
                      {Object.entries(formData.systemSpecifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between bg-white dark:bg-gray-600 p-3 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{key}:</span>
                            <span className="text-gray-600 dark:text-gray-300 ml-2">{value}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSpecification(key)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warranty Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-orange-500" />
                Warranty & Support
              </h2>
              <textarea
                id="warrantyDetails"
                name="warrantyDetails"
                rows={4}
                value={formData.warrantyDetails}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe warranty terms, maintenance support, and after-sales service..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5" />
                    <span>Submit Quote</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </form>
      </div>
    </ProtectedRoute>
  );
}