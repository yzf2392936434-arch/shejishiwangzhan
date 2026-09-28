import React, { useEffect, useRef, useState } from 'react';
import { Music, Volume2, X } from 'lucide-react';
import type { SiteSettings } from '@shared/api.interface';

interface MusicPlayerProps {
  settings: SiteSettings | null;
}

const STORAGE_KEY = 'bgm_playing';

const MusicPlayer: React.FC<MusicPlayerProps> = ({ settings }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [volume, setVolume] = useState(50);

  const bgmEnabled = settings?.bgmEnabled ?? false;
  const bgmUrl = settings?.bgmUrl;
  const bgmVolume = settings?.bgmVolume ?? 50;
  const bgmAutoPlay = settings?.bgmAutoPlay ?? false;

  useEffect(() => { setVolume(bgmVolume); }, [bgmVolume]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);

  useEffect(() => {
    if (!audioRef.current || !bgmUrl) return;
    const tryAutoPlay = () => {
      if (bgmAutoPlay) {
        audioRef.current?.play().catch(() => { setIsPlaying(false); localStorage.setItem(STORAGE_KEY, 'false'); });
        setIsPlaying(true);
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    };
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true' && bgmEnabled && bgmUrl) {
      audioRef.current.play().catch(() => { setIsPlaying(false); localStorage.setItem(STORAGE_KEY, 'false'); });
      setIsPlaying(true);
    } else if (saved !== 'false') {
      tryAutoPlay();
    }
  }, [bgmEnabled, bgmUrl, bgmAutoPlay]);

  const togglePlay = () => {
    if (!audioRef.current || !bgmUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem(STORAGE_KEY, 'false');
    } else {
      audioRef.current.play().then(() => { setIsPlaying(true); localStorage.setItem(STORAGE_KEY, 'true'); }).catch(() => { setIsPlaying(false); });
    }
  };
  const handleError = () => { setIsPlaying(false); localStorage.setItem(STORAGE_KEY, 'false'); };

  if (!bgmEnabled || !bgmUrl) return null;

  return (
    <>
      <audio ref={audioRef} src={bgmUrl} loop onError={handleError} />
      <div className="fixed right-6 bottom-24 z-50 flex flex-col items-end gap-2">
        {showPanel && (
          <div className="bg-white border border-border rounded-lg shadow-lg p-3 w-48 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">背景音乐</span>
              <button type="button" onClick={() => setShowPanel(false)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="关闭面板"><X size={14} /></button>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="text-muted-foreground shrink-0" />
              <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="flex-1 h-1 accent-primary cursor-pointer" aria-label="音量" />
              <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{volume}</span>
            </div>
          </div>
        )}
        <div className="relative">
          <button type="button" onClick={togglePlay} onMouseEnter={() => setShowPanel(true)} onMouseLeave={() => setShowPanel(false)}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg ${isPlaying ? 'bg-primary text-primary-foreground' : 'bg-white text-muted-foreground border border-border hover:text-foreground'}`}
            aria-label={isPlaying ? '暂停音乐' : '播放音乐'}>
            {isPlaying && (<span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />)}
            <Music size={18} className={`relative z-10 ${isPlaying ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>
      </div>
      <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 4s linear infinite; } @keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.15s ease-out; }`}</style>
    </>
  );
};

export default MusicPlayer;
