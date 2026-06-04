import { useState, useRef, useCallback } from 'react';
import { X, Check, Camera, MapPin, AtSign, User as UserIcon, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  onClose: () => void;
}

export default function EditProfile({ onClose }: Props) {
  const { user, updateProfile } = useApp();

  const [name, setName]       = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio]         = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [saving, setSaving]   = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startAvatarCamera = useCallback(async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraOpen(false);
    }
  }, []);

  const captureAvatar = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    const size = Math.min(v.videoWidth, v.videoHeight);
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    const xOff = (v.videoWidth - size) / 2;
    const yOff = (v.videoHeight - size) / 2;
    ctx.scale(-1, 1);
    ctx.drawImage(v, xOff - v.videoWidth, yOff, v.videoWidth, v.videoHeight);
    setAvatarUrl(c.toDataURL('image/jpeg', 0.9));
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
  };

  const cancelCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    updateProfile({
      name: name.trim() || user.name,
      username: username.trim().replace(/^@/, '') || user.username,
      bio: bio.trim(),
      location: location.trim(),
      avatar: avatarUrl,
    });
    setSaving(false);
    onClose();
  };

  const canSave =
    (name.trim() !== user.name ||
     username.trim().replace(/^@/, '') !== user.username ||
     bio.trim() !== user.bio ||
     location.trim() !== user.location ||
     avatarUrl !== user.avatar) && name.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ maxWidth: 430, margin: '0 auto' }}
    >
      <div className="flex-1 bg-white flex flex-col slide-up overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-safe pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button onClick={onClose} className="p-2 text-gray-500 active:scale-90 transition-transform">
            <X size={22} />
          </button>
          <span className="font-semibold text-gray-900 text-base">Edit Profile</span>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`flex items-center gap-1.5 font-semibold text-sm px-4 py-2 rounded-full transition-all
              ${canSave && !saving
                ? 'bg-garden-600 text-white active:scale-95'
                : 'bg-gray-100 text-gray-400'}`}
          >
            <Check size={15} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Avatar section */}
        <div className="flex flex-col items-center py-6 border-b border-gray-100">
          <div className="relative">
            {cameraOpen ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    playsInline muted autoPlay
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={cancelCamera}
                    className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={captureAvatar}
                    className="px-4 py-2 rounded-full bg-garden-600 text-white text-sm font-semibold"
                  >
                    Use This Photo
                  </button>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                />
                <button
                  onClick={startAvatarCamera}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-garden-600 rounded-full flex items-center justify-center shadow-md border-2 border-white active:scale-90 transition-transform"
                  aria-label="Change avatar"
                >
                  <Camera size={14} className="text-white" />
                </button>
              </>
            )}
          </div>
          {!cameraOpen && (
            <button
              onClick={startAvatarCamera}
              className="mt-3 text-sm font-medium text-garden-600 active:opacity-70"
            >
              Change Profile Photo
            </button>
          )}
        </div>

        {/* Form fields */}
        <div className="px-5 py-4 space-y-5">
          <Field
            icon={<UserIcon size={16} className="text-gray-400" />}
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Your full name"
            maxLength={50}
          />
          <Field
            icon={<AtSign size={16} className="text-gray-400" />}
            label="Username"
            value={username}
            onChange={v => setUsername(v.replace(/\s/g, '').toLowerCase())}
            placeholder="username"
            maxLength={30}
            prefix="@"
          />
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <FileText size={16} className="text-gray-400" />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people about your garden..."
              rows={3}
              maxLength={150}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none focus:ring-2 focus:ring-garden-300 transition"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{bio.length}/150</p>
          </div>
          <Field
            icon={<MapPin size={16} className="text-gray-400" />}
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="City, State"
            maxLength={60}
          />
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function Field({
  icon, label, value, onChange, placeholder, maxLength, prefix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
  prefix?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {icon}
        {label}
      </label>
      <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-garden-300 transition">
        {prefix && <span className="text-gray-400 text-sm mr-1">{prefix}</span>}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
        />
      </div>
    </div>
  );
}
