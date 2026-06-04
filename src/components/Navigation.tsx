import { Home, Map, Camera, Search, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { View } from '../types';

const navItems: { view: View; icon: React.ReactNode; label: string }[] = [
  { view: 'feed',    icon: <Home size={22} />,   label: 'Home' },
  { view: 'map',     icon: <Map size={22} />,    label: 'Map' },
  { view: 'explore', icon: <Search size={22} />, label: 'Explore' },
  { view: 'profile', icon: <User size={22} />,   label: 'Profile' },
];

export default function Navigation() {
  const { view, setView } = useApp();

  return (
    <nav className="bottom-nav bg-white border-t border-garden-100 safe-area-pb">
      <div className="flex items-center h-16 px-2">
        {/* Left two items */}
        {navItems.slice(0, 2).map(item => (
          <NavButton key={item.view} item={item} active={view === item.view} onClick={() => setView(item.view)} />
        ))}

        {/* Camera button (center) */}
        <button
          onClick={() => setView('camera')}
          className="flex-1 flex flex-col items-center justify-center"
          aria-label="Take a photo"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all
            ${view === 'camera' ? 'bg-garden-700 scale-95' : 'bg-garden-600 active:scale-90'}`}>
            <Camera size={26} className="text-white" />
          </div>
        </button>

        {/* Right two items */}
        {navItems.slice(2).map(item => (
          <NavButton key={item.view} item={item} active={view === item.view} onClick={() => setView(item.view)} />
        ))}
      </div>
    </nav>
  );
}

function NavButton({ item, active, onClick }: {
  item: { view: View; icon: React.ReactNode; label: string };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1"
      aria-label={item.label}
    >
      <span className={`transition-colors ${active ? 'text-garden-600' : 'text-gray-400'}`}>
        {item.icon}
      </span>
      <span className={`text-[10px] font-medium transition-colors ${active ? 'text-garden-600' : 'text-gray-400'}`}>
        {item.label}
      </span>
    </button>
  );
}
