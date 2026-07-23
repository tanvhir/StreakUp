import React, { useState } from 'react';
import { ThreadPost, User } from '../types';
import { MessageSquare, Heart, Send, Sparkles, User as UserIcon, ShieldCheck, Plus, MessageCircle } from 'lucide-react';

interface CommunityThreadsViewProps {
  threads: ThreadPost[];
  currentUser: User | null;
  onCreateThread: (title: string, content: string) => Promise<void>;
  onLikeThread: (threadId: string) => Promise<void>;
  onAddComment: (threadId: string, content: string) => Promise<void>;
  onOpenAuth: () => void;
}

export const CommunityThreadsView: React.FC<CommunityThreadsViewProps> = ({
  threads,
  currentUser,
  onCreateThread,
  onLikeThread,
  onAddComment,
  onOpenAuth,
}) => {
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setLoading(true);
    try {
      await onCreateThread(title, content);
      setTitle('');
      setContent('');
      setShowNewThreadModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (threadId: string) => {
    if (!commentText.trim()) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setCommentLoading(true);
    try {
      await onAddComment(threadId, commentText);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Peer Feedback & Community Threads</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Ask questions, share study tips, and give encouraging feedback to fellow students in group threads!
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) {
              onOpenAuth();
            } else {
              setShowNewThreadModal(true);
            }
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Discussion Thread</span>
        </button>
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-amber-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Start a Public Discussion Thread</h3>
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Best technique for Organic Chemistry reactions?"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Thread Message / Feedback</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your study tip, question, or encouragement for group members..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {loading ? 'Posting...' : 'Post Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threads Feed */}
      <div className="space-y-4">
        {threads.map((thread) => {
          const isLiked = currentUser && thread.likedBy.includes(currentUser.id);
          const isCommentsOpen = activeCommentThreadId === thread.id;

          return (
            <div
              key={thread.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 transition-all hover:border-slate-300"
            >
              {/* Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={thread.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${thread.userName}`}
                    alt={thread.userName}
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-sm text-slate-900">{thread.userName}</span>
                      {thread.userRole === 'admin' && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center space-x-0.5">
                          <ShieldCheck className="w-3 h-3 text-amber-600 inline" />
                          <span>Mentor</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-1 pl-1">
                {thread.title && (
                  <h3 className="font-bold text-sm text-slate-900">{thread.title}</h3>
                )}
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {thread.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => onLikeThread(thread.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-colors font-medium ${
                    isLiked
                      ? 'bg-rose-50 text-rose-600 font-bold'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{thread.likesCount} Likes</span>
                </button>

                <button
                  onClick={() => setActiveCommentThreadId(isCommentsOpen ? null : thread.id)}
                  className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors font-medium"
                >
                  <MessageCircle className="w-4 h-4 text-slate-400" />
                  <span>{thread.comments.length} Comments</span>
                </button>
              </div>

              {/* Comments Section */}
              {isCommentsOpen && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 mt-2">
                  <h4 className="text-xs font-bold text-slate-800">Comments & Peer Feedback</h4>

                  {/* Comment List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {thread.comments.map((cm) => (
                      <div key={cm.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{cm.userName}</span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700">{cm.content}</p>
                      </div>
                    ))}

                    {thread.comments.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">No comments yet. Be the first to leave feedback!</p>
                    )}
                  </div>

                  {/* Reply Input */}
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Write peer feedback / reply..."
                      className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCommentSubmit(thread.id);
                      }}
                    />
                    <button
                      onClick={() => handleCommentSubmit(thread.id)}
                      disabled={commentLoading}
                      className="p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {threads.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-6 text-slate-500 text-xs">
            No threads created yet. Start a discussion for your study group!
          </div>
        )}
      </div>
    </div>
  );
};
