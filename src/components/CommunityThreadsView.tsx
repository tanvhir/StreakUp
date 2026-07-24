import React, { useState } from 'react';
import { ThreadPost, User } from '../types';
import { MessageSquare, Send, Sparkles, User as UserIcon, ShieldCheck, Plus, MessageCircle, ArrowUp, ArrowDown, MoreVertical, Share2, Flag, Trash2, Edit2 } from 'lucide-react';

interface CommunityThreadsViewProps {
  threads: ThreadPost[];
  currentUser: User | null;
  onCreateThread: (title: string, content: string) => Promise<void>;
  onVoteThread: (threadId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
  onAddComment: (threadId: string, content: string, parentCommentId?: string) => Promise<void>;
  onVoteComment: (commentId: string, payload: { userId: string; voteType: 'upvote' | 'downvote' }) => Promise<void>;
  onOpenAuth: () => void;
}

export const CommunityThreadsView: React.FC<CommunityThreadsViewProps> = ({
  threads,
  currentUser,
  onCreateThread,
  onVoteThread,
  onAddComment,
  onVoteComment,
  onOpenAuth,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; userName: string } | null>(null);
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());
  const [commentSort, setCommentSort] = useState<'best' | 'top' | 'new' | 'controversial'>('best');

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (threadId: string, parentCommentId?: string) => {
    if (!commentText.trim()) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setCommentLoading(true);
    try {
      await onAddComment(threadId, commentText, parentCommentId);
      setCommentText('');
      setReplyingTo(null);
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleVoteComment = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      await onVoteComment(commentId, { userId: currentUser.id, voteType });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleThreadCollapse = (threadId: string) => {
    setCollapsedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const sortComments = (comments: any[], sortType: 'best' | 'top' | 'new' | 'controversial'): any[] => {
    const sorted = [...comments];
    
    switch (sortType) {
      case 'best':
        // Reddit's "Best" algorithm: Wilson score confidence interval
        return sorted.sort((a, b) => {
          const scoreA = calculateBestScore(a.upvotesCount || 0, a.downvotesCount || 0);
          const scoreB = calculateBestScore(b.upvotesCount || 0, b.downvotesCount || 0);
          return scoreB - scoreA;
        });
      case 'top':
        return sorted.sort((a, b) => {
          const scoreA = (a.upvotesCount || 0) - (a.downvotesCount || 0);
          const scoreB = (b.upvotesCount || 0) - (b.downvotesCount || 0);
          return scoreB - scoreA;
        });
      case 'new':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'controversial':
        return sorted.sort((a, b) => {
          const controversyA = calculateControversyScore(a.upvotesCount || 0, a.downvotesCount || 0);
          const controversyB = calculateControversyScore(b.upvotesCount || 0, b.downvotesCount || 0);
          return controversyB - controversyA;
        });
      default:
        return sorted;
    }
  };

  const calculateBestScore = (upvotes: number, downvotes: number): number => {
    const n = upvotes + downvotes;
    if (n === 0) return 0;
    const z = 1.96; // 95% confidence
    const phat = upvotes / n;
    return (phat + z * z / (2 * n) - z * Math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)) / (1 + z * z / n);
  };

  const calculateControversyScore = (upvotes: number, downvotes: number): number => {
    if (upvotes === 0 && downvotes === 0) return 0;
    const total = upvotes + downvotes;
    const ratio = Math.abs(upvotes - downvotes) / total;
    // Lower ratio = more controversial (closer to 50/50 split)
    // But we want higher score for more controversial, so invert
    return (1 - ratio) * total;
  };

  const buildCommentTree = (comments: any[], parentId: string | null = null): any[] => {
    const filtered = comments.filter(cm => cm.parentCommentId === parentId);
    const sorted = sortComments(filtered, commentSort);
    return sorted.map(cm => ({
      ...cm,
      replies: buildCommentTree(comments, cm.id)
    }));
  };

  const renderComment = (comment: any, depth: number = 0, threadId: string) => {
    const isUpvoted = currentUser && comment.userVote === 'upvote';
    const isDownvoted = currentUser && comment.userVote === 'downvote';
    const voteScore = (comment.upvotesCount || 0) - (comment.downvotesCount || 0);
    const isCollapsed = collapsedThreads.has(comment.id);
    const maxDepth = 10;
    const isAtMaxDepth = depth >= maxDepth;

    return (
      <div key={comment.id} className="relative">
        {/* Vertical guide line for nested comments */}
        {depth > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200"
            style={{ left: `${depth * 24 - 12}px` }}
          />
        )}
        
        <div 
          className={`relative ${depth > 0 ? 'ml-6' : ''}`}
          style={{ marginLeft: depth > 0 ? `${depth * 24}px` : '0' }}
        >
          <div className="bg-white rounded-md p-2 hover:bg-slate-50 transition-colors border border-slate-100">
            <div className="flex gap-2">
              {/* Vote Column */}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <button
                  onClick={() => handleVoteComment(comment.id, 'upvote')}
                  className={`p-1 rounded transition-colors ${
                    isUpvoted ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <span className={`text-xs font-bold ${
                  voteScore > 0 ? 'text-orange-500' : voteScore < 0 ? 'text-blue-500' : 'text-slate-500'
                }`}>
                  {voteScore}
                </span>
                <button
                  onClick={() => handleVoteComment(comment.id, 'downvote')}
                  className={`p-1 rounded transition-colors ${
                    isDownvoted ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Content Column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={comment.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.userName}`}
                    alt={comment.userName}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-xs font-semibold text-slate-900">{comment.userName}</span>
                  {comment.userRole === 'admin' && (
                    <ShieldCheck className="w-3 h-3 text-amber-500" />
                  )}
                  <span className="text-[10px] text-slate-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-line mb-2">{comment.content}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setReplyingTo({ commentId: comment.id, userName: comment.userName })}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Reply
                  </button>
                  {comment.replies && comment.replies.length > 0 && (
                    <button
                      onClick={() => toggleThreadCollapse(comment.id)}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                    >
                      {isCollapsed ? `+${comment.replies.length} more` : '− collapse'}
                    </button>
                  )}
                  <button
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                  <button
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <Flag className="w-3 h-3" />
                    Report
                  </button>
                </div>

                {/* Reply Input */}
                {replyingTo?.commentId === comment.id && (
                  <div className="mt-3 flex gap-2">
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder={`Replying to ${comment.userName}...`}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleCommentSubmit(threadId, comment.id)}
                        disabled={commentLoading}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold"
                      >
                        {commentLoading ? '...' : 'Reply'}
                      </button>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nested Comments */}
          {!isCollapsed && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply: any) => renderComment(reply, depth + 1, threadId))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-md">
          <MessageSquare className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Threads</h2>
      </div>

      {/* Inline Thread Composer */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Topic title (optional)"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            />
          </div>
          <div>
            <textarea
              rows={3}
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind? Start a discussion..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Thread'}
            </button>
          </div>
        </form>
      </div>

      {/* Threads Feed */}
      <div className="space-y-3">
        {threads.map((thread) => {
          const isUpvoted = currentUser && thread.userVote === 'upvote';
          const isDownvoted = currentUser && thread.userVote === 'downvote';
          const voteScore = (thread.upvotesCount || 0) - (thread.downvotesCount || 0);
          const isCommentsOpen = activeCommentThreadId === thread.id;

          return (
            <div
              key={thread.id}
              className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex gap-3">
                {/* Vote Column */}
                <div className="flex flex-col items-center gap-0.5 shrink-0 w-10">
                  <button
                    onClick={() => onVoteThread(thread.id, 'upvote')}
                    className={`p-1 rounded transition-colors ${
                      isUpvoted ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <span className={`text-sm font-bold ${
                    voteScore > 0 ? 'text-orange-500' : voteScore < 0 ? 'text-blue-500' : 'text-slate-500'
                  }`}>
                    {voteScore}
                  </span>
                  <button
                    onClick={() => onVoteThread(thread.id, 'downvote')}
                    className={`p-1 rounded transition-colors ${
                      isDownvoted ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                  {/* Author Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={thread.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${thread.userName}`}
                      alt={thread.userName}
                      className="w-5 h-5 rounded-full border border-slate-200"
                    />
                    <span className="text-xs font-semibold text-slate-900">{thread.userName}</span>
                    {thread.userRole === 'admin' && (
                      <ShieldCheck className="w-3 h-3 text-amber-500" />
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-1 mb-2">
                    {thread.title && (
                      <h3 className="font-semibold text-sm text-slate-900">{thread.title}</h3>
                    )}
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {thread.content}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => setActiveCommentThreadId(isCommentsOpen ? null : thread.id)}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{thread.commentCount || thread.comments?.length || 0} Comments</span>
                    </button>
                    <button
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors font-medium"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share</span>
                    </button>
                    <button
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors font-medium"
                    >
                      <Flag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Section - Reddit Style */}
              {isCommentsOpen && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">Comments</h4>
                    <select
                      value={commentSort}
                      onChange={e => setCommentSort(e.target.value as any)}
                      className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                      <option value="best">Best</option>
                      <option value="top">Top</option>
                      <option value="new">New</option>
                      <option value="controversial">Controversial</option>
                    </select>
                  </div>

                  {/* Main Comment Input */}
                  {!replyingTo && (
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                      />
                      <button
                        onClick={() => handleCommentSubmit(thread.id)}
                        disabled={commentLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold self-end"
                      >
                        {commentLoading ? '...' : 'Comment'}
                      </button>
                    </div>
                  )}

                  {/* Comment Tree */}
                  {thread.comments.length > 0 ? (
                    <div className="space-y-2">
                      {buildCommentTree(thread.comments).map(comment => renderComment(comment, 0, thread.id))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No comments yet. Be the first to comment!</p>
                  )}
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
