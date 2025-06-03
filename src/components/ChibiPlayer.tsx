'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import usePremium from '@/hooks/usePremium';

const ANIMATIONS = [
  'animate-bounce',
  'animate-spin',
  'animate-pulse',
  'animate-wiggle',
] as const;

type AnimationType = typeof ANIMATIONS[number];
type AudioSource = {
  url: string;
  isCustom: boolean;
};

export default function ChibiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType | ''>('');
  const [showSettings, setShowSettings] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [audioSource, setAudioSource] = useState<AudioSource>({
    url: '/bg-music.mp3',
    isCustom: false
  });
  const [error, setError] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const chibiRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 0 });

  const { isPremium, loading } = usePremium();

  useEffect(() => {
    const savedUrl = localStorage.getItem('customMusicUrl');
    const savedVolume = localStorage.getItem('volume');

    if (savedUrl) setAudioSource({ url: savedUrl, isCustom: true });
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      if (audioRef.current) audioRef.current.volume = vol;
    }

    setPosition({ x: 16, y: window.innerHeight - 150 });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !chibiRef.current) return;

      const chibi = chibiRef.current;
      const newX = Math.min(
        Math.max(0, e.clientX - chibi.offsetWidth / 2),
        window.innerWidth - chibi.offsetWidth
      );
      const newY = Math.min(
        Math.max(0, e.clientY - chibi.offsetHeight / 2),
        window.innerHeight - chibi.offsetHeight
      );

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setCurrentAnimation('');
    } else {
      audioRef.current.play().catch(() => {
        setError('Playback failed - check audio permissions');
        setIsPlaying(false);
      });
      setCurrentAnimation(ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)]);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMinimize = () => setMinimized(!minimized);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    localStorage.setItem('volume', newVolume.toString());
  };

  const handleCustomMusic = () => {
    try {
      const url = new URL(customUrl);
      const safeUrl = process.env.NODE_ENV === 'production'
        ? customUrl.replace('http://', 'https://')
        : customUrl;

      setAudioSource({ url: safeUrl, isCustom: true });
      setError('');
      localStorage.setItem('customMusicUrl', safeUrl);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = safeUrl;
        audioRef.current.load();
        if (isPlaying) audioRef.current.play();
      }
    } catch {
      setError('Invalid audio URL (MP3 recommended)');
    }
  };

  const handleResetMusic = () => {
    setCustomUrl('');
    setAudioSource({ url: '/bg-music.mp3', isCustom: false });
    localStorage.removeItem('customMusicUrl');

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '/bg-music.mp3';
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          setError('Failed to play default music');
        });
      }
    }
    setError('');
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full w-16 h-16" />
      </div>
    );
  }

  if (!isPremium) {
    return null;
  }

  return (
    <div
      ref={chibiRef}
      style={{ left: position.x, top: position.y }}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.drag-handle')) {
          setIsDragging(true);
        }
      }}
      className={`fixed z-50 group cursor-move ${minimized ? 'w-16 h-16' : ''}`}
    >
      {!minimized ? (
        <div className="relative hover:scale-110 transition-transform drag-handle">
          <button
            onClick={toggleMinimize}
            className="absolute -top-2 -right-2 bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-full shadow-md hover:scale-125 transition-transform z-50"
            aria-label="Minimize"
          >
            <span className="text-xs block w-4 h-4 text-black dark:text-white">−</span>
          </button>

          <div onClick={togglePlay} className="relative">
            <Image
              src="/chibi-character.png"
              width={120}
              height={120}
              alt="Music Chibi"
              className={`${currentAnimation} transition-all duration-300 hover:drop-shadow-glow ${isPlaying ? 'brightness-110' : ''}`}
              priority
            />
            {isPlaying && (
              <div className="absolute -top-4 -right-4 text-2xl animate-pulse text-purple-500 dark:text-purple-300">
                ♫
              </div>
            )}
          </div>

          {showSettings && (
            <div className="absolute -left-4 -top-60 bg-white/90 dark:bg-gray-800/90 text-black dark:text-white p-4 rounded-lg shadow-lg backdrop-blur-sm w-64">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Custom Music URL
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="https://example.com/music.mp3"
                  />
                  <button
                    onClick={handleCustomMusic}
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Load Music
                  </button>
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Volume
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-purple-500"
                  />
                  <div className="text-xs mt-1">
                    Volume: {Math.round(volume * 100)}%
                  </div>
                </div>

                <button
                  onClick={handleResetMusic}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Reset to Default Music
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="absolute -bottom-2 -right-2 bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-full shadow-md hover:scale-125 transition-transform"
          >
            ⚙️
          </button>
        </div>
      ) : (
        <div className="drag-handle w-16 h-16">
          <button
            onClick={toggleMinimize}
            className="bg-white/90 dark:bg-gray-800/90 p-3 rounded-full shadow-md hover:scale-110 transition-transform w-full h-full flex items-center justify-center relative"
            aria-label="Maximize"
          >
            <span className="text-2xl">♪</span>
            {isPlaying && (
              <span className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      )}

      <audio
        ref={audioRef}
        loop
        onError={() => setError('Error loading audio')}
      >
        <source src={audioSource.url} type="audio/mpeg" />
        Your browser does not support audio
      </audio>
    </div>
  );
}
