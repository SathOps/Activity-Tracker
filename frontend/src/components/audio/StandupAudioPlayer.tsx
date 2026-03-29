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
      <div
        style={{
          fontSize: 12,
          color: 'var(--danger-text)',
          padding: '8px',
          textAlign: 'center',
        }}
      >
        {t('audio.urlMissing')}
      </div>
    );
  }

  return (
    <div
      className="standup-audio-player"
      style={{
        display: 'grid',
        gap: 8,
        padding: '12px',
        backgroundColor: 'var(--surface-0)',
        color: 'var(--text-main)',
        borderRadius: 10,
        border: '1px solid var(--border)',
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Audio-only content; captions track not available for these short standup clips. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={audioUrl} autoPlay />

      {hasError ? (
        <div
          style={{
            fontSize: 12,
            color: 'var(--danger-text)',
            textAlign: 'center',
          }}
        >
          {t('audio.unableToPlay')}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-main)',
              }}
            >
              {label || t('audio.standupAudio')}
            </span>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-subtle)',
                fontFamily: 'monospace',
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: '100%',
              height: 4,
              accentColor: 'var(--accent)',
              cursor: 'pointer',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginTop: 4,
            }}
          >
            <button
              onClick={() => skip(-10)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: 'var(--text-subtle)',
              }}
              title={t('audio.rewind10')}
              type="button"
            >
              <span role="img" aria-label={t('audio.rewind')}>
                ⏪
              </span>
            </button>

            <button
              onClick={togglePlay}
              style={{
                background:
                  'linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: 14,
                boxShadow: '0 8px 14px rgba(30, 79, 178, 0.26)',
              }}
              title={isPlaying ? t('audio.pause') : t('audio.play')}
              type="button"
            >
              {isPlaying ? (
                <span
                  role="img"
                  aria-label={t('audio.pause')}
                  style={{ fontSize: 12 }}
                >
                  ⏸
                </span>
              ) : (
                <span
                  role="img"
                  aria-label={t('audio.play')}
                  style={{ fontSize: 12, marginLeft: 2 }}
                >
                  ▶
                </span>
              )}
            </button>

            <button
              onClick={() => skip(10)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: 'var(--text-subtle)',
              }}
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
