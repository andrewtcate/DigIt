import { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, Check, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Post } from '../types';

const PLANT_OPTIONS = [
  { name: 'Tomato',      emoji: '🍅' },
  { name: 'Pepper',      emoji: '🌶️' },
  { name: 'Zucchini',    emoji: '🥒' },
  { name: 'Lettuce',     emoji: '🥗' },
  { name: 'Basil',       emoji: '🌿' },
  { name: 'Sunflower',   emoji: '🌻' },
  { name: 'Strawberry',  emoji: '🍓' },
  { name: 'Blueberry',   emoji: '🫐' },
  { name: 'Carrot',      emoji: '🥕' },
  { name: 'Rose',        emoji: '🌹' },
  { name: 'Lavender',    emoji: '💜' },
  { name: 'Cucumber',    emoji: '🥒' },
  { name: 'Eggplant',    emoji: '🍆' },
  { name: 'Corn',        emoji: '🌽' },
  { name: 'Pumpkin',     emoji: '🎃' },
  { name: 'Herb',        emoji: '🌱' },
  { name: 'Tree',        emoji: '🌳' },
  { name: 'Flower',      emoji: '🌸' },
];

interface Props {
  imageUrl: string;
  onRetake: () => void;
  onDone: () => void;
}

export default function NewPost({ imageUrl, onRetake, onDone }: Props) {
  const { addPost, user } = useApp();
  const [caption, setCaption] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<{ name: string; emoji: string } | null>(null);
  const [customPlant, setCustomPlant] = useState('');
  const [location, setLocation] = useState<{ name: string; city: string; state: string; lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ name: 'Unknown Location', city: 'Unknown', state: '', lat: 36.0, lng: -86.7 });
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county ||
            'Unknown';
          const state = data.address.state_code || data.address.state || '';
          setLocation({
            name: `${city}${state ? ', ' + state : ''}`,
            city,
            state,
            lat: latitude,
            lng: longitude,
          });
        } catch {
          setLocation({ name: 'Unknown Location', city: 'Unknown', state: '', lat: latitude, lng: longitude });
        }
        setLocating(false);
      },
      () => {
        setLocation({ name: 'Unknown Location', city: 'Unknown', state: '', lat: 36.0, lng: -86.7 });
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }, []);

  const canPost = (selectedPlant || customPlant.trim()) && !locating;

  const handlePost = async () => {
    if (!canPost || posting) return;
    setPosting(true);

    const plant = selectedPlant ?? { name: customPlant.trim(), emoji: '🌱' };
    const loc = location ?? { name: 'Unknown', city: 'Unknown', state: '', lat: 36.0, lng: -86.7 };

    const newPost: Post = {
      id: `p-${Date.now()}`,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      imageUrl,
      caption: caption.trim() || `Growing ${plant.name} right now! ${plant.emoji}`,
      plantName: plant.name,
      plantEmoji: plant.emoji,
      location: loc,
      likes: 0,
      comments: [],
      timestamp: new Date(),
      tags: [plant.name.toLowerCase()],
      isLiked: false,
    };

    await new Promise(r => setTimeout(r, 800));
    addPost(newPost);
    onDone();
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={onRetake} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={20} />
          <span className="text-sm">Retake</span>
        </button>
        <span className="font-semibold text-gray-900">New Post</span>
        <button
          onClick={handlePost}
          disabled={!canPost || posting}
          className={`flex items-center gap-1.5 font-semibold text-sm px-4 py-2 rounded-full transition-all
            ${canPost && !posting
              ? 'bg-garden-600 text-white active:scale-95'
              : 'bg-gray-100 text-gray-400'}`}
        >
          {posting ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {/* Image preview */}
      <div className="relative">
        <img src={imageUrl} alt="Captured" className="w-full aspect-square object-cover" />
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
          📸 Just taken
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-4 space-y-5">
        {/* Caption */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Tell people about what you're growing..."
            rows={3}
            className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none focus:ring-2 focus:ring-garden-300 transition"
          />
        </div>

        {/* Plant selector */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            What are you growing? *
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PLANT_OPTIONS.map(plant => (
              <button
                key={plant.name}
                onClick={() => { setSelectedPlant(plant); setCustomPlant(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                  ${selectedPlant?.name === plant.name
                    ? 'bg-garden-600 text-white border-garden-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 active:scale-95'}`}
              >
                <span>{plant.emoji}</span>
                <span>{plant.name}</span>
              </button>
            ))}
          </div>
          <input
            value={customPlant}
            onChange={e => { setCustomPlant(e.target.value); setSelectedPlant(null); }}
            placeholder="Or type your own plant name..."
            className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-garden-300 transition"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Location
          </label>
          <div className="flex items-center gap-3 bg-garden-50 rounded-2xl px-4 py-3">
            <MapPin size={18} className="text-garden-600 flex-shrink-0" />
            {locating ? (
              <div className="flex items-center gap-2">
                <Loader size={14} className="animate-spin text-garden-400" />
                <span className="text-sm text-garden-600">Getting your location...</span>
              </div>
            ) : (
              <span className="text-sm font-medium text-garden-700">{location?.name}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 px-1">
            Your location is automatically added so others can discover what's growing near them.
          </p>
        </div>
      </div>
    </div>
  );
}
