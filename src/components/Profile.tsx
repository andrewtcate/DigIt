import { Settings, MapPin, Camera } from 'lucide-react';
import { useApp, currentUser } from '../context/AppContext';

const SEASONS = ['🌱 Spring', '☀️ Summer', '🍂 Fall', '❄️ Winter'];

export default function Profile() {
  const { posts, setView } = useApp();

  const myPosts = posts.filter(p => p.userId === currentUser.id);

  const stats = [
    { label: 'Posts', value: myPosts.length + currentUser.postsCount },
    { label: 'Followers', value: currentUser.followers.toLocaleString() },
    { label: 'Following', value: currentUser.following.toLocaleString() },
  ];

  const plantsSummary = [
    { emoji: '🍅', name: 'Tomatoes', count: 12 },
    { emoji: '🌿', name: 'Herbs', count: 8 },
    { emoji: '🫐', name: 'Blueberries', count: 4 },
    { emoji: '🌸', name: 'Flowers', count: 6 },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-garden-50/95 backdrop-blur-md px-4 pt-safe">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-xl font-bold text-garden-700 tracking-tight">Profile</h1>
          <button className="text-gray-500 p-2">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Cover / Avatar */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-garden-400 to-garden-700" />
        <div className="absolute -bottom-12 left-5">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-24 h-24 rounded-2xl border-4 border-white shadow-md object-cover"
          />
        </div>
      </div>

      {/* User info */}
      <div className="pt-14 px-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{currentUser.name}</h2>
            <p className="text-sm text-gray-500">@{currentUser.username}</p>
          </div>
          <button className="border border-garden-600 text-garden-600 text-sm font-semibold px-4 py-1.5 rounded-full active:bg-garden-50 transition-colors">
            Edit Profile
          </button>
        </div>
        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{currentUser.bio}</p>
        <div className="flex items-center gap-1 mt-2 text-gray-500">
          <MapPin size={14} />
          <span className="text-sm">{currentUser.location}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {stats.map(s => (
            <div key={s.label} className="flex flex-col items-center py-1">
              <span className="text-xl font-bold text-gray-900">{s.value}</span>
              <span className="text-xs text-gray-500 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Garden stats */}
      <div className="px-4 mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">My Garden</h3>
        <div className="grid grid-cols-2 gap-2">
          {plantsSummary.map(plant => (
            <div key={plant.name} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
              <span className="text-2xl">{plant.emoji}</span>
              <div>
                <div className="text-sm font-medium text-gray-900">{plant.name}</div>
                <div className="text-xs text-gray-400">{plant.count} plants</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasons gardening */}
      <div className="px-4 mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Seasons Gardened</h3>
        <div className="flex gap-2">
          {SEASONS.map(season => (
            <span
              key={season}
              className={`flex-1 text-center text-xs py-2 rounded-xl font-medium
                ${season.includes('Spring') || season.includes('Summer')
                  ? 'bg-garden-100 text-garden-700'
                  : 'bg-gray-100 text-gray-400'}`}
            >
              {season}
            </span>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      <div className="px-4 pb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Recent Posts</h3>
        {myPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="text-5xl mb-3">📸</div>
            <p className="text-gray-700 font-medium">No posts yet</p>
            <p className="text-gray-400 text-sm mt-1">Take a photo of your garden to get started</p>
            <button
              onClick={() => setView('camera')}
              className="mt-4 btn-primary flex items-center gap-2 mx-auto"
            >
              <Camera size={16} />
              Take First Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {myPosts.map(post => (
              <div key={post.id} className="aspect-square rounded-lg overflow-hidden">
                <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Dummy past posts grid */}
        <div className="grid grid-cols-3 gap-1 mt-1">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden">
              <img
                src={`https://picsum.photos/seed/garden${i + 20}/200/200`}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
