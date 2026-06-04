import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, X, Heart, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Post } from '../types';

// Fix Leaflet default icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createPlantIcon(emoji: string) {
  return L.divIcon({
    html: `
      <div style="
        width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:#2d6a4f;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:18px;line-height:1;">${emoji}</span>
      </div>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -48],
  });
}

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

interface NearbyGroup {
  city: string;
  state: string;
  lat: number;
  lng: number;
  posts: Post[];
}

export default function MapView() {
  const { posts, toggleLike } = useApp();
  const [focusedPost, setFocusedPost] = useState<Post | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Group posts by city
  const groups = posts.reduce<Record<string, NearbyGroup>>((acc, post) => {
    const key = `${post.location.city},${post.location.state}`;
    if (!acc[key]) {
      acc[key] = {
        city: post.location.city,
        state: post.location.state,
        lat: post.location.lat,
        lng: post.location.lng,
        posts: [],
      };
    }
    acc[key].posts.push(post);
    return acc;
  }, {});

  const groupList = Object.values(groups);

  const handleMarkerClick = (post: Post) => {
    setFocusedPost(post);
    setFlyTarget({ lat: post.location.lat, lng: post.location.lng });
    setSheetOpen(true);
  };

  return (
    <div className="map-page flex flex-col">
      {/* Map header */}
      <header className="bg-garden-600 text-white px-4 pt-safe pb-3">
        <div className="flex items-center gap-2 h-14">
          <MapPin size={20} />
          <span className="font-bold text-lg tracking-tight">Garden Map</span>
          <span className="ml-auto text-xs bg-white/20 px-3 py-1 rounded-full">
            {posts.length} gardens
          </span>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[37.5, -95.0]}
          zoom={4}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {flyTarget && <FlyToLocation lat={flyTarget.lat} lng={flyTarget.lng} />}

          {posts.map(post => (
            <Marker
              key={post.id}
              position={[post.location.lat, post.location.lng]}
              icon={createPlantIcon(post.plantEmoji)}
              eventHandlers={{ click: () => handleMarkerClick(post) }}
            >
              <Popup>
                <div className="w-48">
                  <img
                    src={post.imageUrl}
                    alt={post.plantName}
                    className="w-full h-28 object-cover"
                  />
                  <div className="p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <img src={post.userAvatar} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-xs font-semibold text-gray-800">@{post.username}</span>
                    </div>
                    <span className="plant-tag text-xs">{post.plantEmoji} {post.plantName}</span>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{post.caption}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Nearby cities legend */}
        <div className="absolute bottom-4 left-3 right-3 z-[1000]">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setSheetOpen(v => !v)}
            >
              <span className="font-semibold text-gray-900 text-sm">
                🌍 What's growing where
              </span>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform ${sheetOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {sheetOpen && (
              <div className="max-h-48 overflow-y-auto border-t border-gray-100 divide-y divide-gray-50">
                {groupList.map(group => (
                  <button
                    key={`${group.city},${group.state}`}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left active:bg-garden-50"
                    onClick={() => {
                      setFlyTarget({ lat: group.lat, lng: group.lng });
                      setSheetOpen(false);
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {group.city}, {group.state}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {group.posts.slice(0, 4).map(p => p.plantEmoji).join(' ')}
                        {' '}
                        {group.posts.map(p => p.plantName).slice(0, 2).join(', ')}
                        {group.posts.length > 2 ? ` +${group.posts.length - 2} more` : ''}
                      </div>
                    </div>
                    <span className="text-xs text-garden-600 font-semibold bg-garden-50 px-2 py-1 rounded-full">
                      {group.posts.length} post{group.posts.length > 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected post overlay */}
      {focusedPost && (
        <div className="absolute bottom-0 left-0 right-0 z-[2000] p-3 slide-up pointer-events-none"
          style={{ bottom: 180 }}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex">
            <img
              src={focusedPost.imageUrl}
              alt=""
              className="w-20 h-20 object-cover flex-shrink-0"
            />
            <div className="flex-1 p-3 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <img src={focusedPost.userAvatar} alt="" className="w-5 h-5 rounded-full" />
                <span className="text-xs font-semibold text-gray-900 truncate">@{focusedPost.username}</span>
              </div>
              <span className="plant-tag">{focusedPost.plantEmoji} {focusedPost.plantName}</span>
              <p className="text-xs text-gray-500 mt-1 truncate">{focusedPost.location.name}</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 px-3">
              <button
                onClick={() => toggleLike(focusedPost.id)}
                className="flex flex-col items-center"
              >
                <Heart
                  size={20}
                  className={focusedPost.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                />
                <span className="text-xs text-gray-500">{focusedPost.likes}</span>
              </button>
              <button onClick={() => setFocusedPost(null)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
