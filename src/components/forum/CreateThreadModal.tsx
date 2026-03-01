'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { FORUM_CATEGORIES } from '@/lib/forumCategories';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
  onCreated: (threadId: string) => void;
}

export function CreateThreadModal({ isOpen, onClose, defaultCategory, onCreated }: CreateThreadModalProps) {
  const [category, setCategory] = useState(defaultCategory || FORUM_CATEGORIES[0].id);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    if (body.length < 10) {
      setError('Body must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_thread', category, title, body }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to create thread');
        return;
      }

      setTitle('');
      setBody('');
      onCreated(json.data.id);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">New Thread</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
            >
              {FORUM_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your topic?"
              maxLength={200}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
            />
            <p className="text-[11px] text-gray-500 mt-1">{title.length}/200</p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts, analysis, or question..."
              maxLength={10000}
              rows={6}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 resize-none"
            />
            <p className="text-[11px] text-gray-500 mt-1">{body.length}/10000</p>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              {submitting ? 'Posting...' : 'Post Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
