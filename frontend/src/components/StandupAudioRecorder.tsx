import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecorder } from '../hooks/useRecorder';

interface StandupAudioRecorderProps {
  disabled: boolean;
  onAudioChange: (audioBlob: Blob | null) => void;
  onDurationChange: (durationSeconds: number) => void;
}

export function StandupAudioRecorder({
  disabled,
  onAudioChange,
  onDurationChange,
}: StandupAudioRecorderProps) {
  const { t } = useTranslation();
  const {
    isSupported,
    isRecording,
    isPaused,
    audioBlob,
    error,
    formattedDuration,
    durationSeconds,
    isPermissionDenied,
    start,
    stop,
    pause,
    resume,
    cancel,
    clear,
  } = useRecorder();

  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setAudioPreviewUrl('');
  }, [audioBlob]);

  useEffect(() => {
    onAudioChange(audioBlob);
  }, [audioBlob, onAudioChange]);

  useEffect(() => {
    onDurationChange(durationSeconds);
  }, [durationSeconds, onDurationChange]);

  const isDisabled = disabled || !isSupported;

  return (
    <div className="recorder-section">
      <div className="recorder-controls">
        <button
          type="button"
          className="primary-button recorder-btn"
          onClick={() => void start()}
          disabled={isDisabled || isRecording}
        >
          {t('recorder.startRecording')}
        </button>
        {!isPaused ? (
          <button
            type="button"
            className="secondary-button recorder-btn"
            onClick={pause}
            disabled={isDisabled || !isRecording}
          >
            {t('recorder.pause')}
          </button>
        ) : (
          <button
            type="button"
            className="secondary-button recorder-btn"
            onClick={resume}
            disabled={isDisabled}
          >
            {t('recorder.resume')}
          </button>
        )}
        <button
          type="button"
          className="secondary-button recorder-btn"
          onClick={stop}
          disabled={isDisabled || !isRecording}
        >
          {t('recorder.stop')}
        </button>
        <button
          type="button"
          className="secondary-button recorder-btn"
          onClick={cancel}
          disabled={isDisabled || !isRecording}
        >
          {t('recorder.cancel')}
        </button>
        <button
          type="button"
          className="ghost-button recorder-btn"
          onClick={clear}
          disabled={isDisabled || !audioBlob || isRecording}
        >
          {t('recorder.clear')}
        </button>
      </div>

      <p className="recorder-hint">{t('recorder.minimumHint')}</p>

      {!isSupported && (
        <p className="recorder-error">{t('recorder.notSupported')}</p>
      )}

      {disabled && (
        <p className="recorder-hint">{t('recorder.loginRequired')}</p>
      )}

      {isRecording && !isPaused && (
        <p className="recorder-recording">
          {t('recorder.recordingInProgress')}{' '}
          <span className="recorder-timer">{formattedDuration}</span>
        </p>
      )}

      {isRecording && isPaused && (
        <p className="recorder-recording recorder-paused">
          {t('recorder.paused')}{' '}
          <span className="recorder-timer">{formattedDuration}</span>
        </p>
      )}

      {isPermissionDenied && (
        <div className="recorder-permission-denied">
          <p>{t('recorder.permissionDenied')}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void start()}
            disabled={disabled}
          >
            {t('recorder.retryPermission')}
          </button>
        </div>
      )}

      {error && <p className="recorder-error">{error}</p>}

      {audioPreviewUrl && (
        // oxlint-disable-next-line jsx-a11y/media-has-caption
        <audio
          className="recorder-preview"
          controls
          src={audioPreviewUrl}
          aria-label={t('recorder.audioPreview')}
        />
      )}
    </div>
  );
}
