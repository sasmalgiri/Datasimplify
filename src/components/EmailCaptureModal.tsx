'use client';

import { useState } from 'react';
import { X, Download, Mail, Check, Loader2 } from 'lucide-react';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  downloadType?: string;
}

export default function EmailCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  downloadType = 'data',
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Save to Supabase
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Save to localStorage for persistence
      localStorage.setItem('ds_user_email', email);
      localStorage.setItem('ds_user_id', data.userId || '');

      onSuccess(email);
    } catch (err) {
      console.error('Registration error:', err);
      // Even if API fails, save locally and proceed
      localStorage.setItem('ds_user_email', email);
      onSuccess(email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Download Your {downloadType}</h2>
          <p className="text-orange-100">Enter your email to get free access</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">What you get (free):</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>3 free downloads per month</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Excel & CSV formats</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Now
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-center text-gray-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-orange-600 hover:underline">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="text-orange-600 hover:underline">Privacy Policy</a>
          </p>
        </form>
      </div>
    </div>
  );
}
