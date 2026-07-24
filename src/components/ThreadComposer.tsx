import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ThreadComposerProps {
  currentUser: any;
  onSubmit: (title: string, content: string) => Promise<void>;
  loading?: boolean;
}

export const ThreadComposer: React.FC<ThreadComposerProps> = ({
  currentUser,
  onSubmit,
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!currentUser) {
      setError('Please log in to create a thread');
      return;
    }

    setError(null);
    try {
      await onSubmit(title, content);
      setTitle('');
      setContent('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create thread. Please try again.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Topic title (optional)"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
        </div>
        <div>
          <textarea
            rows={3}
            required
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind? Start a discussion..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none placeholder:text-slate-400"
          />
        </div>
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post Thread
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
