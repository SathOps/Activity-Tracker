import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface StandupAudioPlayerProps {
  audioUrl: string;
  label?: string;
  onPause?: () => void;
}

export const StandupAudioPlayer: React.FC<StandupAudioPlayerProps> = ({
  audioUrl,
  label,
  onPause,
}) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Format time in mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Playback failed:', err);
        setHasError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (amount: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(audioRef.current.duration, audioRef.current.currentTime + amount)
    );
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };
    const handleError = () => setHasError(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onPause]);

  if (!audioUrl) {
    return (
      <div className="text-[12px] text-[var(--danger-text)] p-2 text-center">
        {t('audio.urlMissing')}
      </div>
    );
  }

  return (
    <div className="grid gap-2 p-[12px] !bg-[var(--surface-0)] text-[var(--text-main)] rounded-[10px] !border !border-[var(--border)] w-full max-w-[400px] !shadow-[var(--shadow-soft)]">
      {/* Audio-only content; captions track not available for these short standup clips. */}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={audioUrl} autoPlay />

      {hasError ? (
        <div className="text-[12px] text-[var(--danger-text)] text-center">
          {t('audio.unableToPlay')}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-[var(--text-main)]">
              {label || t('audio.standupAudio')}
            </span>
            <div className="text-[11px] text-[var(--text-subtle)] font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 accent-[var(--accent)] cursor-pointer"
          />

          <div className="flex items-center justify-center gap-4 mt-1">
            <button
              onClick={() => skip(-10)}
              className="bg-transparent border-none cursor-pointer text-[18px] text-[var(--text-subtle)]"
              title={t('audio.rewind10')}
              type="button"
            >
              <span role="img" aria-label={t('audio.rewind')}>
                ⏪
              </span>
            </button>

            <button
              onClick={togglePlay}
              className="bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-strong)_100%)] border-none rounded-full w-[36px] h-[36px] flex items-center justify-center cursor-pointer text-white text-[14px] shadow-[0_8px_14px_rgba(30,79,178,0.26)]"
              title={isPlaying ? t('audio.pause') : t('audio.play')}
              type="button"
            >
              {isPlaying ? (
                <span
                  role="img"
                  aria-label={t('audio.pause')}
                  className="text-[12px]"
                >
                  ⏸
                </span>
              ) : (
                <span
                  role="img"
                  aria-label={t('audio.play')}
                  className="text-[12px] ml-[2px]"
                >
                  ▶
                </span>
              )}
            </button>

            <button
              onClick={() => skip(10)}
              className="bg-transparent border-none cursor-pointer text-[18px] text-[var(--text-subtle)]"
              title={t('audio.forward10')}
              type="button"
            >
              <span role="img" aria-label={t('audio.forward')}>
                ⏩
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StandupAudioPlayer;
