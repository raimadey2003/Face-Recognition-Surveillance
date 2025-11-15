import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  ArrowLeft,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface PoliceLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void; // 🔹 Add this prop
}

export default function PoliceLogin({ onBack, onLoginSuccess, onSwitchToRegister }: PoliceLoginProps) {
  const [formData, setFormData] = useState({
    badgeNumber: '',
    password: '',
    station: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';
      const response = await fetch(`${apiUrl}/api/police/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          badgeNumber: formData.badgeNumber,
          station: formData.station,
          password: formData.password
        })
      });

      // Get response text first to handle both JSON and non-JSON responses
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
        console.log('Police login response:', data); // Debug log
      } catch (parseError) {
        console.error('Failed to parse response:', parseError, 'Response text:', responseText);
        setError('Server returned invalid response. Please check if backend is running.');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || data.error || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Store token
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Police login successful, token stored'); // Debug log
        onLoginSuccess();
      } else {
        console.error('Missing token in response:', data);
        setError('Server response missing token. Please try again.');
      }
    } catch (err: any) {
      console.error('Police login error:', err);
      setError(err.message || 'Unable to connect to server. Please check if backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 flex items-center justify-center p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      <motion.div
        className="w-full max-w-md relative z-10"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        {/* Back Button */}
        <motion.button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </motion.button>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Police Officer Login</h1>
            <p className="text-gray-300">Secure access to surveillance system</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-200">{error}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Badge Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Badge Number *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.badgeNumber}
                  onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Enter your badge number"
                  required
                />
              </div>
            </div>

            {/* Station */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Police Station *
              </label>
              <select
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                required
              >
                <option value="" className="bg-gray-800">Select your station</option>
                <option value="ujjain-central" className="bg-gray-800">Ujjain Central Police Station</option>
                <option value="kotwali" className="bg-gray-800">Kotwali Police Station</option>
                <option value="nanakheda" className="bg-gray-800">Nanakheda Police Station</option>
                <option value="dewas-gate" className="bg-gray-800">Dewas Gate Police Station</option>
                <option value="mahakal" className="bg-gray-800">Mahakal Police Station</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Login to Dashboard
                </>
              )}
            </motion.button>
          </form>

          {/* Switch to Registration */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-300 mb-4">Don’t have an account?</p>
            <motion.button
              onClick={onSwitchToRegister}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Register as Police Officer
            </motion.button>
          </div>

          {/* Additional Info */}
          <div className="mt-6">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Secure encrypted connection</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              For technical support, contact IT helpdesk at ext. 2847
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
