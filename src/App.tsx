import { AppProvider, useApp } from './context/AppContext';
import Navigation from './components/Navigation';
import Feed from './components/Feed';
import MapView from './components/MapView';
import Camera from './components/Camera';
import Explore from './components/Explore';
import Profile from './components/Profile';

function AppContent() {
  const { view } = useApp();

  const isCamera = view === 'camera';
  const isMap = view === 'map';

  return (
    <div className="app-shell">
      {/* Main content area */}
      <div className={isCamera ? 'camera-page' : isMap ? 'map-page' : 'flex-1 flex flex-col min-h-0'}>
        {view === 'feed'    && <Feed />}
        {view === 'map'     && <MapView />}
        {view === 'camera'  && <Camera />}
        {view === 'explore' && <Explore />}
        {view === 'profile' && <Profile />}
      </div>

      {/* Bottom navigation (hidden during camera) */}
      {view !== 'camera' && <Navigation />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
