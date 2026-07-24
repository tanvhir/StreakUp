import React, { useState } from 'react';
import { MessageCircle, Share2, Flag, ArrowUp, ArrowDown, ShieldCheck } from 'lucide-react';
import { CommentTree } from './CommentTree';

interface ThreadCardProps {
  thread: any;
  currentUser: any;
  onVote: (threadId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
  onVoteComment: (commentId: string, payload: { userId: string; voteType: 'upvote' | 'downvote' }) => Promise<void>;
  onReply: (threadId: string, content: string, parentCommentId?: string) => Promise<void>;
  onOpenAuth: () => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({
  thread,
  currentUser,
  onVote,
  onVoteComment,
  onReply,
  onOpenAuth,
}) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const isUpvoted = currentUser && thread.userVote === 'upvote';
  const isDownvoted = currentUser && thread.userVote === 'downvote';
  const voteScore = (thread.upvotesCount || 0) - (thread.downvotesCount || 0);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      await onVote(thread.id, voteType);
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const commentCount = thread.commentCount || thread.comments?.length || 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex gap-3">
        {/* Vote Column */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-10">
          <button
            onClick={() => handleVote('upvote')}
            className={`p-1.5 rounded-lg transition-colors ${
              isUpvoted ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
            }`}
            aria-label="Upvote"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <span className={`text-sm font-bold ${
            voteScore > 0 ? 'text-orange-500' : voteScore < 0 ? 'text-blue-500' : 'text-slate-500'
          }`}>
            {voteScore}
          </span>
          <button
            onClick={() => handleVote('downvote')}
            className={`p-1.5 rounded-lg transition-colors ${
              isDownvoted ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'
            }`}
            aria-label="Downvote"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Author Header */}
          <div className="flex items-center gap-2 mb-3">
            <img
              src={thread.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${thread.userName}`}
              alt={thread.userName}
              className="w-6 h-6 rounded-full border border-slate-200"
            />
            <span className="text-sm font-semibold text-slate-900">{thread.userName}</span>
            {thread.userRole === 'admin' && (
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-xs text-slate-400">
              {formatRelativeTime(thread.createdAt)}
            </span>
          </div>

          {/* Title & Body */}
          <div className="space-y-2 mb-3">
            {thread.title && (
              <h3 className="font-bold text-base text-slate-900 leading-tight">{thread.title}</h3>
            )}
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {thread.content}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                isCommentsOpen 
                  ? 'text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{commentCount} Comments</span>
            </button>
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
              <Flag className="w-4 h-4" />
              <span>Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {isCommentsOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <CommentTree
            comments={thread.comments || []}
            currentUser={currentUser}
            threadId={thread.id}
            onVote={onVoteComment}
            onReply={onReply}
          />
        </div>
      )}
    </div>
  );
};
