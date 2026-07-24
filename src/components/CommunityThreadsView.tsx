import React, { useState } from 'react';
import { ThreadPost, User } from '../types';
import { MessageSquare } from 'lucide-react';
import { ThreadComposer } from './ThreadComposer';
import { ThreadCard } from './ThreadCard';

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
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateThread = async (title: string, content: string) => {
    setIsCreating(true);
    try {
      await onCreateThread(title, content);
    } finally {
      setIsCreating(false);
    }
  };

  const handleVoteComment = async (commentId: string, payload: { userId: string; voteType: 'upvote' | 'downvote' }) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    await onVoteComment(commentId, payload);
  };

  const handleReply = async (threadId: string, content: string, parentCommentId?: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    await onAddComment(threadId, content, parentCommentId);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-gradient-to-tr from-orange-500 to-orange-600 text-white rounded-xl shadow-md">
          <MessageSquare className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Threads</h2>
      </div>

      {/* Thread Composer - Always Visible */}
      <ThreadComposer
        currentUser={currentUser}
        onSubmit={handleCreateThread}
        loading={isCreating}
      />

      {/* Threads Feed */}
      <div className="space-y-4">
        {threads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            currentUser={currentUser}
            onVote={onVoteThread}
            onVoteComment={handleVoteComment}
            onReply={handleReply}
            onOpenAuth={onOpenAuth}
          />
        ))}

        {threads.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No threads yet</h3>
            <p className="text-sm text-slate-500">Be the first to start a discussion in your study group!</p>
          </div>
        )}
      </div>
    </div>
  );
};
