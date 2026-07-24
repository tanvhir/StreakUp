import React, { useState } from 'react';
import { CommentNode } from './CommentNode';
import { InlineReplyEditor } from './InlineReplyEditor';

interface CommentTreeProps {
  comments: any[];
  currentUser: any;
  threadId: string;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
  onReply: (threadId: string, content: string, parentCommentId?: string) => Promise<void>;
  maxDepth?: number;
}

export const CommentTree: React.FC<CommentTreeProps> = ({
  comments,
  currentUser,
  threadId,
  onVote,
  onReply,
  maxDepth = 10,
}) => {
  const [sortType, setSortType] = useState<'best' | 'top' | 'new' | 'controversial'>('best');
  const [isMainReplying, setIsMainReplying] = useState(false);
  const [mainReplyLoading, setMainReplyLoading] = useState(false);

  // Sorting algorithms
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
    return (1 - ratio) * total;
  };

  const sortComments = (comments: any[]): any[] => {
    const sorted = [...comments];
    
    switch (sortType) {
      case 'best':
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

  // Build comment tree recursively
  const buildCommentTree = (comments: any[], parentId: string | null = null): any[] => {
    const filtered = comments.filter(cm => cm.parentCommentId === parentId);
    const sorted = sortComments(filtered);
    return sorted.map(cm => ({
      ...cm,
      replies: buildCommentTree(comments, cm.id)
    }));
  };

  const handleMainReply = async (content: string) => {
    setMainReplyLoading(true);
    try {
      await onReply(threadId, content);
      setIsMainReplying(false);
    } catch (err) {
      console.error('Main reply error:', err);
    } finally {
      setMainReplyLoading(false);
    }
  };

  const commentTree = buildCommentTree(comments);

  return (
    <div className="space-y-3">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Comments</h4>
        <select
          value={sortType}
          onChange={e => setSortType(e.target.value as any)}
          className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
        >
          <option value="best">Best</option>
          <option value="top">Top</option>
          <option value="new">New</option>
          <option value="controversial">Controversial</option>
        </select>
      </div>

      {/* Main Comment Input */}
      {!isMainReplying && (
        <button
          onClick={() => setIsMainReplying(true)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors text-left"
        >
          Add a comment...
        </button>
      )}

      {isMainReplying && (
        <InlineReplyEditor
          replyingTo="this thread"
          onCancel={() => setIsMainReplying(false)}
          onSubmit={handleMainReply}
          loading={mainReplyLoading}
          placeholder="What are your thoughts?"
        />
      )}

      {/* Comment Tree */}
      {commentTree.length > 0 ? (
        <div className="space-y-2">
          {commentTree.map(comment => (
            <CommentNode
              key={comment.id}
              comment={comment}
              depth={0}
              currentUser={currentUser}
              threadId={threadId}
              onVote={onVote}
              onReply={onReply}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-sm text-slate-400 italic">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
};
