import { useRef, useState, useEffect, useCallback } from 'react';
import { FlipHorizontal, X, Zap, ZapOff, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import NewPost from './NewPost';

type CameraState = 'loading' | 'active' | 'error' | 'captured';

export default function Camera() {
  const { setView } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>('loading');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setCameraState('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 1600 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('active');
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setErrorMsg('Camera access denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device.');
      } else {
        setErrorMsg('Unable to access camera. Please try again.');
      }
      setCameraState('error');
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facingMode === 'user') {
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    const imageData = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(imageData);
    setCameraState('captured');
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  if (capturedImage) {
    return <NewPost imageUrl={capturedImage} onRetake={retake} onDone={() => setView('feed')} />;
  }

  return (
    <div className="camera-page flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-safe pb-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => setView('feed')}
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
        >
          <X size={20} className="text-white" />
        </button>
        <div className="text-white font-semibold text-base tracking-wide">Take a Photo</div>
        <button
          onClick={() => setFlashOn(v => !v)}
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
        >
          {flashOn ? <Zap size={20} className="text-yellow-400" /> : <ZapOff size={20} className="text-white" />}
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {cameraState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-3 border-garden-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {cameraState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <p className="text-white text-sm leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="mt-6 bg-garden-600 text-white rounded-full px-6 py-3 font-semibold text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
          style={{
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            opacity: cameraState === 'active' ? 1 : 0,
          }}
        />

        {/* Grid overlay */}
        {cameraState === 'active' && (
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '33.33% 33.33%',
          }} />
        )}

        {/* "No photo library" notice */}
        <div className="absolute top-20 left-4 right-4 flex justify-center pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full opacity-70">
            📸 Live camera only · No photo library
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
        <div className="bg-gradient-to-t from-black/80 to-transparent pt-12 pb-8 px-8">
          <div className="flex items-center justify-between">
            <div className="w-14" />

            {/* Shutter button */}
            <button
              onPointerDown={capturePhoto}
              disabled={cameraState !== 'active'}
              className="shutter-btn w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
              aria-label="Capture photo"
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>

            {/* Flip camera */}
            <button
              onClick={flipCamera}
              disabled={cameraState !== 'active'}
              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center disabled:opacity-40"
              aria-label="Flip camera"
            >
              <FlipHorizontal size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
