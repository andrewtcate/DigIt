import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Post from './Post';
import CommentsSheet from './CommentsSheet';
import type { Post as PostType } from '../types';

export default function Feed() {
  const { posts, setView } = useApp();
  const [commentPost, setCommentPost] = useState<PostType | null>(null);

  return (
    <div className="page-content">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-garden-50/95 backdrop-blur-md px-4 pt-safe">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Leaf size={22} className="text-garden-600" />
            <span className="text-xl font-bold text-garden-700 tracking-tight">Dig It</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-garden-600 bg-garden-100 px-3 py-1 rounded-full font-medium">
              📍 Spring Hill, TN
            </span>
          </div>
        </div>
      </header>

      {/* Stories / Following row */}
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {/* Add story button */}
          <button
            onClick={() => setView('camera')}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-garden-600 flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-white text-2xl">+</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Your Story</span>
          </button>
          {/* Recent posters */}
          {posts.slice(0, 8).map(post => (
            <div key={post.id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-14 h-14 rounded-full p-0.5 ${post.isLiked ? 'bg-gradient-to-br from-garden-300 to-garden-600' : 'bg-gradient-to-br from-garden-400 to-green-600'}`}>
                <img
                  src={post.userAvatar}
                  alt={post.username}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
              <span className="text-[10px] text-gray-500 w-14 text-center truncate">
                {post.username.split('_')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Currently growing near you banner */}
      <div className="mx-4 mb-4 bg-garden-600 rounded-2xl p-4 text-white">
        <p className="text-xs font-medium opacity-80 mb-1">🌱 Growing near Spring Hill, TN</p>
        <div className="flex flex-wrap gap-2">
          {['🍅 Tomatoes', '🫐 Blueberries', '🌿 Basil', '🍓 Strawberries'].map(item => (
            <span key={item} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Posts feed */}
      <div className="px-3">
        {posts.map(post => (
          <Post key={post.id} post={post} onCommentOpen={setCommentPost} />
        ))}
      </div>

      {/* Comments sheet */}
      {commentPost && (
        <CommentsSheet post={commentPost} onClose={() => setCommentPost(null)} />
      )}
    </div>
  );
}
