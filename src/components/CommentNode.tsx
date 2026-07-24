import React, { useState } from 'react';
import { MessageCircle, Share2, Flag, ChevronDown, ChevronRight, ArrowUp, ArrowDown, ShieldCheck } from 'lucide-react';
import { InlineReplyEditor } from './InlineReplyEditor';

interface CommentNodeProps {
  comment: any;
  depth: number;
  currentUser: any;
  threadId: string;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
  onReply: (threadId: string, content: string, parentCommentId: string) => Promise<void>;
  maxDepth?: number;
}

export const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  depth,
  currentUser,
  threadId,
  onVote,
  onReply,
  maxDepth = 10,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  const isUpvoted = currentUser && comment.userVote === 'upvote';
  const isDownvoted = currentUser && comment.userVote === 'downvote';
  const voteScore = (comment.upvotesCount || 0) - (comment.downvotesCount || 0);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isAtMaxDepth = depth >= maxDepth;

  const handleReply = async (content: string) => {
    setReplyLoading(true);
    try {
      await onReply(threadId, content, comment.id);
      setIsReplying(false);
    } catch (err) {
      console.error('Reply error:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!currentUser) return;
    try {
      await onVote(comment.id, voteType);
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

  return (
    <div className="relative">
      {/* Vertical tree connector line */}
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
        {/* Comment Card */}
        <div className="bg-white rounded-lg p-3 hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm">
          <div className="flex gap-3">
            {/* Vote Column */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 w-8">
              <button
                onClick={() => handleVote('upvote')}
                className={`p-1 rounded transition-colors ${
                  isUpvoted ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                }`}
                aria-label="Upvote"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <span className={`text-xs font-bold ${
                voteScore > 0 ? 'text-orange-500' : voteScore < 0 ? 'text-blue-500' : 'text-slate-500'
              }`}>
                {voteScore}
              </span>
              <button
                onClick={() => handleVote('downvote')}
                className={`p-1 rounded transition-colors ${
                  isDownvoted ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'
                }`}
                aria-label="Downvote"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0">
              {/* Author Header */}
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={comment.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.userName}`}
                  alt={comment.userName}
                  className="w-5 h-5 rounded-full border border-slate-200"
                />
                <span className="text-xs font-semibold text-slate-900">{comment.userName}</span>
                {comment.userRole === 'admin' && (
                  <ShieldCheck className="w-3 h-3 text-amber-500" />
                )}
                <span className="text-[10px] text-slate-400">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>

              {/* Comment Content */}
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-3">
                {comment.content}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 text-xs">
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Reply
                </button>
                {hasReplies && (
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                  >
                    {isCollapsed ? (
                      <>
                        <ChevronRight className="w-3.5 h-3.5" />
                        {comment.replies?.length} replies
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Collapse
                      </>
                    )}
                  </button>
                )}
                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors">
                  <Flag className="w-3.5 h-3.5" />
                  Report
                </button>
              </div>

              {/* Inline Reply Editor */}
              {isReplying && (
                <InlineReplyEditor
                  replyingTo={comment.userName}
                  onCancel={() => setIsReplying(false)}
                  onSubmit={handleReply}
                  loading={replyLoading}
                  placeholder={`Replying to ${comment.userName}...`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Nested Replies */}
        {!isCollapsed && hasReplies && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply: any) => (
              <CommentNode
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                currentUser={currentUser}
                threadId={threadId}
                onVote={onVote}
                onReply={onReply}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}

        {/* Continue thread link at max depth */}
        {isAtMaxDepth && hasReplies && !isCollapsed && (
          <button className="mt-2 text-xs text-orange-500 hover:text-orange-600 font-medium">
            Continue this thread →
          </button>
        )}
      </div>
    </div>
  );
};
