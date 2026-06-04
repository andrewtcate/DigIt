import { useState, useRef } from 'react';
import { Heart, MessageCircle, MapPin, MoreHorizontal } from 'lucide-react';
import type { Post as PostType } from '../types';
import { useApp } from '../context/AppContext';

interface Props {
  post: PostType;
  onCommentOpen?: (post: PostType) => void;
}

export default function Post({ post, onCommentOpen }: Props) {
  const { toggleLike } = useApp();
  const [heartAnim, setHeartAnim] = useState(false);
  const lastTap = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!post.isLiked) {
        toggleLike(post.id);
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 600);
      }
    }
    lastTap.current = now;
  };

  const timeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 0) return `${d}d`;
    if (h > 0) return `${h}h`;
    return 'now';
  };

  return (
    <article className="bg-white mb-3 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <img
          src={post.userAvatar}
          alt={post.username}
          className="avatar w-9 h-9 border-2 border-garden-200"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">@{post.username}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} />
            <span className="truncate">{post.location.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="plant-tag">{post.plantEmoji} {post.plantName}</span>
          <button className="text-gray-400 p-1" aria-label="More options">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Image with double-tap */}
      <div className="relative" onPointerUp={handleDoubleTap}>
        <img
          src={post.imageUrl}
          alt={post.caption}
          className="post-image bg-garden-100"
          loading="lazy"
        />
        {/* Double-tap heart overlay */}
        {heartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              size={80}
              className="text-white fill-white drop-shadow-xl"
              style={{ animation: 'heartPop 0.6s ease-in-out' }}
            />
          </div>
        )}
        {/* Timestamp badge */}
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          {timeAgo(post.timestamp)} ago
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              toggleLike(post.id);
              setHeartAnim(true);
              setTimeout(() => setHeartAnim(false), 300);
            }}
            className="flex items-center gap-1.5 group"
            aria-label={post.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={22}
              className={`transition-all ${post.isLiked
                ? 'fill-red-500 text-red-500 scale-110'
                : 'text-gray-500 group-active:scale-90'}`}
            />
            <span className="text-sm font-medium text-gray-700">{post.likes.toLocaleString()}</span>
          </button>
          <button
            onClick={() => onCommentOpen?.(post)}
            className="flex items-center gap-1.5 text-gray-500"
            aria-label="Comments"
          >
            <MessageCircle size={22} />
            <span className="text-sm font-medium text-gray-700">{post.comments.length}</span>
          </button>
          <div className="ml-auto">
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs text-garden-500 mr-2">#{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="px-4 pb-4">
        <p className="text-sm text-gray-800 leading-relaxed">
          <span className="font-semibold">@{post.username}</span>{' '}
          {post.caption}
        </p>
        {post.comments.length > 0 && (
          <button
            onClick={() => onCommentOpen?.(post)}
            className="text-xs text-gray-400 mt-1"
          >
            View {post.comments.length === 1 ? '1 comment' : `all ${post.comments.length} comments`}
          </button>
        )}
      </div>
    </article>
  );
}
