import { useState } from 'react';
import { Search, TrendingUp, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { trendingPlants, plantCategories } from '../data/mockData';
import type { Post } from '../types';
import CommentsSheet from './CommentsSheet';

export default function Explore() {
  const { posts, toggleLike } = useApp();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [commentPost, setCommentPost] = useState<Post | null>(null);

  const filtered = posts.filter(post => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      post.plantName.toLowerCase().includes(q) ||
      post.username.toLowerCase().includes(q) ||
      post.location.city.toLowerCase().includes(q) ||
      post.caption.toLowerCase().includes(q) ||
      post.tags.some(t => t.includes(q));

    const matchesCategory =
      !activeCategory ||
      (activeCategory === 'vegetables' && ['Tomato', 'Pepper', 'Zucchini', 'Lettuce', 'Carrot', 'Kale', 'Jalapeño Peppers', 'Mixed Lettuce', 'Chantenay Carrots', 'Lacinato Kale'].some(v => post.plantName.includes(v))) ||
      (activeCategory === 'fruits' && ['Blueberr', 'Strawberr', 'Zucchini'].some(v => post.plantName.includes(v))) ||
      (activeCategory === 'herbs' && ['Basil', 'Lavender', 'herb'].some(v => post.plantName.toLowerCase().includes(v))) ||
      (activeCategory === 'flowers' && ['Zinnia', 'Sunflower', 'Lavender', 'Rose', 'flower'].some(v => post.plantName.toLowerCase().includes(v)));

    return matchesQuery && matchesCategory;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-garden-50/95 backdrop-blur-md px-4 pt-safe">
        <div className="flex items-center h-14">
          <h1 className="text-xl font-bold text-garden-700 tracking-tight flex-1">Explore</h1>
        </div>
        {/* Search bar */}
        <div className="flex items-center gap-3 bg-white border border-garden-100 rounded-2xl px-4 py-2.5 mb-3 shadow-sm">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search plants, people, places..."
            className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 text-xs">✕</button>
          )}
        </div>
      </header>

      {/* Category pills */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all
              ${!activeCategory ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            All
          </button>
          {plantCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                ${activeCategory === cat.id ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trending plants */}
      {!query && !activeCategory && (
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-garden-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Trending This Week</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {trendingPlants.slice(0, 6).map((plant, i) => (
              <button
                key={plant.name}
                onClick={() => setQuery(plant.name)}
                className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm text-left active:scale-98 transition-transform"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0
                  ${i % 3 === 0 ? 'bg-garden-100' : i % 3 === 1 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                  {plant.emoji}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{plant.name}</div>
                  <div className="text-xs text-gray-400">{plant.count.toLocaleString()} posts</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      {(query || activeCategory) && (
        <div className="px-4 mb-2">
          <p className="text-xs text-gray-500 font-medium">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {query ? ` for "${query}"` : ''}
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="px-3">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(post => (
            <ExploreCard
              key={post.id}
              post={post}
              onLike={() => toggleLike(post.id)}
              onComment={() => setCommentPost(post)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 text-sm">No results found</p>
            <p className="text-gray-400 text-xs mt-1">Try a different search</p>
          </div>
        )}
      </div>

      {commentPost && (
        <CommentsSheet post={commentPost} onClose={() => setCommentPost(null)} />
      )}
    </div>
  );
}

function ExploreCard({ post, onLike }: {
  post: Post;
  onLike: () => void;
  onComment: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-98 transition-transform">
      <div className="relative">
        <img
          src={post.imageUrl}
          alt={post.plantName}
          className="w-full aspect-square object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
            {post.plantEmoji}
          </span>
        </div>
        <div className="absolute bottom-2 right-2">
          <button
            onClick={onLike}
            className="bg-black/40 backdrop-blur-sm rounded-full p-1.5"
          >
            <span className={`text-xs ${post.isLiked ? 'text-red-400' : 'text-white'}`}>
              ♥ {post.likes}
            </span>
          </button>
        </div>
      </div>
      <div className="p-2.5">
        <div className="text-xs font-semibold text-gray-900 truncate">{post.plantName}</div>
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={10} className="text-gray-400 flex-shrink-0" />
          <span className="text-[10px] text-gray-400 truncate">{post.location.city}, {post.location.state}</span>
        </div>
      </div>
    </div>
  );
}
