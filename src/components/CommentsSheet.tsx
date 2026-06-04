import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import type { Post, Comment } from '../types';
import { useApp } from '../context/AppContext';

interface Props {
  post: Post;
  onClose: () => void;
}

export default function CommentsSheet({ post, onClose }: Props) {
  const { user } = useApp();
  const [text, setText] = useState('');
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      text: text.trim(),
      timestamp: new Date(),
    };
    setComments(prev => [...prev, newComment]);
    setText('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const timeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return 'just now';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ maxWidth: 430, margin: '0 auto' }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl slide-up flex flex-col max-h-[75vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Comments</h3>
          <button onClick={onClose} className="text-gray-400 p-1">
            <X size={20} />
          </button>
        </div>
        {/* Post preview */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <img src={post.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 line-clamp-2">{post.caption}</p>
            <span className="plant-tag mt-1">{post.plantEmoji} {post.plantName}</span>
          </div>
        </div>
        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {comments.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">Be the first to comment!</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <img src={c.avatar} alt="" className="avatar w-8 h-8 flex-shrink-0" />
              <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-gray-900">@{c.username}</span>
                  <span className="text-[10px] text-gray-400">{timeAgo(c.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 pb-safe">
          <img src={user.avatar} alt="" className="avatar w-8 h-8 flex-shrink-0" />
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
            />
            <button
              onClick={submit}
              disabled={!text.trim()}
              className="text-garden-600 disabled:text-gray-300 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
