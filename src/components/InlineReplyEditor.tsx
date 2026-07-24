import React, { useState, useEffect, useRef } from 'react';

interface InlineReplyEditorProps {
  replyingTo: string;
  onCancel: () => void;
  onSubmit: (content: string) => Promise<void>;
  loading?: boolean;
  placeholder?: string;
}

export const InlineReplyEditor: React.FC<InlineReplyEditorProps> = ({
  replyingTo,
  onCancel,
  onSubmit,
  loading = false,
  placeholder = "Write your reply...",
}) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await onSubmit(content);
      setContent('');
    } catch (err) {
      console.error('Reply submission error:', err);
    }
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-slate-200 animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          ref={textareaRef}
          rows={2}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 resize-none placeholder:text-slate-400"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Reply'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
