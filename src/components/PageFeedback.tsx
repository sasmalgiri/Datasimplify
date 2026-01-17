'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, X, Send, CheckCircle } from 'lucide-react';

type FeedbackReason =
  | 'missing_metric'
  | 'need_template'
  | 'confusing'
  | 'other';

const FEEDBACK_REASONS: { value: FeedbackReason; label: string }[] = [
  { value: 'missing_metric', label: 'Missing a metric' },
  { value: 'need_template', label: 'Need an Excel template for this' },
  { value: 'confusing', label: 'Confusing / too technical' },
  { value: 'other', label: 'Other' },
];

interface PageFeedbackProps {
  pagePath: string;
  pageTitle: string;
  variant?: 'floating' | 'inline';
}

export function PageFeedback({ pagePath, pageTitle, variant = 'floating' }: PageFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'reason' | 'submitted'>('initial');
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [reason, setReason] = useState<FeedbackReason | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHelpful = (value: boolean) => {
    setHelpful(value);
    if (value) {
      // Positive feedback - submit immediately
      submitFeedback(value, null, '');
    } else {
      // Negative feedback - show reasons
      setStep('reason');
    }
  };

  const submitFeedback = async (
    helpfulValue: boolean,
    reasonValue: FeedbackReason | null,
    messageValue: string
  ) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagePath,
          pageTitle,
          helpful: helpfulValue,
          reason: reasonValue,
          message: messageValue.slice(0, 400), // Max 400 chars
        }),
      });
      setStep('submitted');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReason = () => {
    if (reason) {
      submitFeedback(false, reason, message);
    }
  };

  const resetForm = () => {
    setStep('initial');
    setHelpful(null);
    setReason(null);
    setMessage('');
    setIsOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className="border-t border-gray-700 pt-6 mt-8">
        <FeedbackContent
          step={step}
          helpful={helpful}
          reason={reason}
          message={message}
          isSubmitting={isSubmitting}
          onHelpful={handleHelpful}
          onReasonChange={setReason}
          onMessageChange={setMessage}
          onSubmit={handleSubmitReason}
          onReset={resetForm}
        />
      </div>
    );
  }

  // Floating variant
  return (
    <>
      {/* Trigger Button */}
      {!isOpen && step !== 'submitted' && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full shadow-lg text-sm text-gray-300 hover:text-white transition-all"
        >
          <span>Was this helpful?</span>
          <div className="flex gap-1">
            <ThumbsUp className="w-4 h-4" />
            <ThumbsDown className="w-4 h-4" />
          </div>
        </button>
      )}

      {/* Floating Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="text-sm font-medium text-white">Page Feedback</span>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <FeedbackContent
              step={step}
              helpful={helpful}
              reason={reason}
              message={message}
              isSubmitting={isSubmitting}
              onHelpful={handleHelpful}
              onReasonChange={setReason}
              onMessageChange={setMessage}
              onSubmit={handleSubmitReason}
              onReset={resetForm}
            />
          </div>
        </div>
      )}

      {/* Success Toast */}
      {step === 'submitted' && !isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          Thanks for your feedback!
        </div>
      )}
    </>
  );
}

interface FeedbackContentProps {
  step: 'initial' | 'reason' | 'submitted';
  helpful: boolean | null;
  reason: FeedbackReason | null;
  message: string;
  isSubmitting: boolean;
  onHelpful: (value: boolean) => void;
  onReasonChange: (reason: FeedbackReason) => void;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

function FeedbackContent({
  step,
  reason,
  message,
  isSubmitting,
  onHelpful,
  onReasonChange,
  onMessageChange,
  onSubmit,
  onReset,
}: FeedbackContentProps) {
  if (step === 'submitted') {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Thank you!</p>
        <p className="text-gray-400 text-sm mb-4">Your feedback helps us improve.</p>
        <button
          onClick={onReset}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Submit more feedback
        </button>
      </div>
    );
  }

  if (step === 'reason') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-300">What could be better?</p>
        <div className="space-y-2">
          {FEEDBACK_REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                reason === r.value
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => onReasonChange(r.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  reason === r.value ? 'border-emerald-500' : 'border-gray-500'
                }`}
              >
                {reason === r.value && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-sm text-gray-200">{r.label}</span>
            </label>
          ))}
        </div>

        {reason === 'other' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Tell us more (optional, max 400 chars)
            </label>
            <textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value.slice(0, 400))}
              placeholder="What were you trying to do?"
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {message.length}/400
            </div>
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={!reason || isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isSubmitting ? (
            'Submitting...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    );
  }

  // Initial step
  return (
    <div className="text-center">
      <p className="text-sm text-gray-300 mb-4">Was this page helpful?</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => onHelpful(true)}
          className="flex items-center gap-2 px-6 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 transition-colors"
        >
          <ThumbsUp className="w-5 h-5" />
          Yes
        </button>
        <button
          onClick={() => onHelpful(false)}
          className="flex items-center gap-2 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
        >
          <ThumbsDown className="w-5 h-5" />
          No
        </button>
      </div>
    </div>
  );
}
