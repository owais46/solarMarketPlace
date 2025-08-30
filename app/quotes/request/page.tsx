'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  HomeIcon,
  LightBulbIcon,
  CpuChipIcon,
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface QuotationForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  houseDimensionsMarla: string;
  numberOfLights: string;
  numberOfFans: string;
  avgMonthlyBillAmount: string;
  appliances: Record<string, string>;
  additionalRequirements: string;
}

export default function RequestQuotePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<QuotationForm>({
    name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    houseDimensionsMarla: '',
    numberOfLights: '',
    numberOfFans: '',
    avgMonthlyBillAmount: '',
    appliances: {},
    additionalRequirements: ''
  });
  const [newApplianceName, setNewApplianceName] = useState('');
  const [newApplianceQuantity, setNewApplianceQuantity] = useState('');

  const commonAppliances = [
    'Air Conditioner',
    'Refrigerator',
    'Television',
    'Washing Machine',
    'Microwave',
    'Water Heater',
    'Electric Heater',
    'Computer/Laptop',
    'Iron',
    'Dishwasher'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.houseDimensionsMarla || !formData.avgMonthlyBillAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('quotation_requests')
        .insert([
          {
            user_id: profile?.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            house_dimensions_marla: parseFloat(formData.houseDimensionsMarla),
            number_of_lights: parseInt(formData.numberOfLights) || 0,
            number_of_fans: parseInt(formData.numberOfFans) || 0,
            avg_monthly_bill_amount: parseFloat(formData.avgMonthlyBillAmount),
            appliances: formData.appliances,
            additional_requirements: formData.additionalRequirements
          }
        ]);

      if (error) throw error;

      toast.success('Quotation request submitted successfully!');
      router.push('/quotes');
    } catch (error: any) {
      console.error('Error submitting quotation request:', error);
      toast.error('Failed to submit quotation request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addAppliance = (applianceName?: string) => {
    const name = applianceName || newApplianceName;
    const quantity = newApplianceQuantity;
    
    if (name && quantity && !formData.appliances[name]) {
      setFormData({
        ...formData,
        appliances: {
          ...formData.appliances,
          [name]: quantity
        }
      });
      setNewApplianceName('');
      setNewApplianceQuantity('');
    }
  };

  const removeAppliance = (applianceName: string) => {
    const newAppliances = { ...formData.appliances };
    delete newAppliances[applianceName];
    setFormData({
      ...formData,
      appliances: newAppliances
    });
  };

  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Request Solar Quotation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Provide your house details to get customized solar installation quotes from verified sellers
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-8 border border-gray-100 dark:border-gray-700"
          >
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <HomeIcon className="h-5 w-5 mr-2 text-orange-500" />
                Personal Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Complete Address *
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your complete address"
                  />
                </div>
              </div>
            </div>

            {/* House Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <HomeIcon className="h-5 w-5 mr-2 text-orange-500" />
                House Details
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="houseDimensionsMarla" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    House Dimensions (Marla) *
                  </label>
                  <input
                    id="houseDimensionsMarla"
                    name="houseDimensionsMarla"
                    type="number"
                    step="0.5"
                    required
                    value={formData.houseDimensionsMarla}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label htmlFor="numberOfLights" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Lights
                  </label>
                  <input
                    id="numberOfLights"
                    name="numberOfLights"
                    type="number"
                    min="0"
                    value={formData.numberOfLights}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 15"
                  />
                </div>

                <div>
                  <label htmlFor="numberOfFans" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Fans
                  </label>
                  <input
                    id="numberOfFans"
                    name="numberOfFans"
                    type="number"
                    min="0"
                    value={formData.numberOfFans}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 8"
                  />
                </div>

                <div>
                  <label htmlFor="avgMonthlyBillAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Average Monthly Bill (USD) *
                  </label>
                  <input
                    id="avgMonthlyBillAmount"
                    name="avgMonthlyBillAmount"
                    type="number"
                    step="0.01"
                    required
                    value={formData.avgMonthlyBillAmount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 150.00"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter your average electricity bill amount over the last 12 months
                  </p>
                </div>
              </div>
            </div>

            {/* Household Appliances */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CpuChipIcon className="h-5 w-5 mr-2 text-orange-500" />
                Household Appliances
              </h2>
              
              {/* Quick Add Common Appliances */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Add Common Appliances:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {commonAppliances.map(appliance => (
                    <button
                      key={appliance}
                      type="button"
                      onClick={() => {
                        setNewApplianceName(appliance);
                        setNewApplianceQuantity('1');
                      }}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/20 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                    >
                      {appliance}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Appliance */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newApplianceName}
                    onChange={(e) => setNewApplianceName(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Appliance name"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={newApplianceQuantity}
                      onChange={(e) => setNewApplianceQuantity(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Qty"
                    />
                    <button
                      type="button"
                      onClick={() => addAppliance()}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Appliances List */}
                {Object.entries(formData.appliances).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Added Appliances:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(formData.appliances).map(([name, quantity]) => (
                        <div key={name} className="flex items-center justify-between bg-white dark:bg-gray-600 p-3 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                            <span className="text-gray-600 dark:text-gray-300 ml-2">× {quantity}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAppliance(name)}
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

            {/* Additional Requirements */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-orange-500" />
                Additional Requirements
              </h2>
              <textarea
                id="additionalRequirements"
                name="additionalRequirements"
                rows={4}
                value={formData.additionalRequirements}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Any specific requirements, preferences, or questions about your solar installation..."
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
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </form>

        {/* Information Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
        >
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            What happens next?
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>We'll calculate potential savings based on your bill amount</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Match you with suitable solar installers in your area</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Receive customized quotes based on your requirements</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Compare quotes and choose the best solar solution</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}