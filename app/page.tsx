'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { 
  SunIcon, 
  BoltIcon, 
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: DocumentTextIcon,
    title: 'Smart Bill Analysis',
    description: 'Upload your electricity bills and get instant analysis with AI-powered text extraction'
  },
  {
    icon: SunIcon,
    title: 'Solar Quotes',
    description: 'Get customized solar installation quotes from verified sellers in your area'
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Direct Communication',
    description: 'Chat directly with sellers to discuss your solar needs and customize solutions'
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Best Pricing',
    description: 'Compare quotes from multiple sellers to ensure you get the best deal'
  }
];

const stats = [
  { value: '10,000+', label: 'Happy Customers' },
  { value: '500+', label: 'Verified Sellers' },
  { value: '$2M+', label: 'Savings Generated' },
  { value: '98%', label: 'Satisfaction Rate' }
];

export default function HomePage() {
  const { user, profile } = useAuth();

  const getDashboardLink = () => {
    switch (profile?.role) {
      case 'admin':
        return '/admin';
      case 'seller':
        return '/seller';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mb-6">
                <SunIcon className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Power Your Home with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                  {' '}Solar Energy
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Connect with verified solar installers, get instant quotes, and make the switch to clean energy. 
                Our platform simplifies your journey to solar with smart bill analysis and competitive pricing.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              {user ? (
                <Link
                  href={getDashboardLink()}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signup?role=user"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Get Solar Quote
                  </Link>
                  <Link
                    href="/auth/signup?role=seller"
                    className="bg-white text-orange-600 border-2 border-orange-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-50 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Join as Seller
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose SolarMarket?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We've streamlined the solar journey with cutting-edge technology and trusted partnerships
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
              >
                <div className="bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white dark:text-gray-100 mb-6">
              Ready to Go Solar?
            </h2>
            <p className="text-xl text-orange-100 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of homeowners who have made the switch to clean, renewable energy. 
              Start your solar journey today!
            </p>
            <Link
              href="/auth/signup"
              className="bg-white text-orange-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
            >
              {user ? 'Go to Dashboard' : 'Get Started Now'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-2 rounded-lg">
                <SunIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">SolarMarket</span>
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              © 2025 SolarMarket. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}