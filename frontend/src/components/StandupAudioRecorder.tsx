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
    <div className="grid gap-2.5">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <button
          type="button"
          className="primary-button w-full sm:w-auto px-3.5 py-1.5 text-center"
          onClick={() => void start()}
          disabled={isDisabled || isRecording}
        >
          {t('recorder.startRecording')}
        </button>
        {!isPaused ? (
          <button
            type="button"
            className="secondary-button w-full sm:w-auto px-3.5 py-1.5 text-center"
            onClick={pause}
            disabled={isDisabled || !isRecording}
          >
            {t('recorder.pause')}
          </button>
        ) : (
          <button
            type="button"
            className="secondary-button w-full sm:w-auto px-3.5 py-1.5 text-center"
            onClick={resume}
            disabled={isDisabled}
          >
            {t('recorder.resume')}
          </button>
        )}
        <button
          type="button"
          className="secondary-button w-full sm:w-auto px-3.5 py-1.5 text-center"
          onClick={stop}
          disabled={isDisabled || !isRecording}
        >
          {t('recorder.stop')}
        </button>
        <button
          type="button"
          className="secondary-button w-full sm:w-auto px-3.5 py-1.5 text-center"
          onClick={cancel}
          disabled={isDisabled || !isRecording}
        >
          {t('recorder.cancel')}
        </button>
        <button
          type="button"
          className="w-full sm:w-auto cursor-pointer rounded-[14px] border border-white/[0.08] bg-white/5 px-4 py-2.5 text-center text-[13px] font-semibold text-white backdrop-blur-[12px] transition-all duration-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={clear}
          disabled={isDisabled || !audioBlob || isRecording}
        >
          {t('recorder.clear')}
        </button>
      </div>

      <p className="m-0 text-xs text-slate-500">{t('recorder.minimumHint')}</p>

      {!isSupported && (
        <p className="m-0 text-xs text-red-500">{t('recorder.notSupported')}</p>
      )}

      {disabled && (
        <p className="m-0 text-xs text-slate-500">
          {t('recorder.loginRequired')}
        </p>
      )}

      {isRecording && !isPaused && (
        <p className="m-0 text-[13px] font-semibold text-amber-600">
          {t('recorder.recordingInProgress')}{' '}
          <span className="tabular-nums">{formattedDuration}</span>
        </p>
      )}

      {isRecording && isPaused && (
        <p className="m-0 text-[13px] font-semibold text-indigo-500">
          {t('recorder.paused')}{' '}
          <span className="tabular-nums">{formattedDuration}</span>
        </p>
      )}

      {isPermissionDenied && (
        <div className="grid gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 dark:border-red-900/30 dark:bg-red-900/10">
          <p className="m-0 text-xs text-red-600 dark:text-red-400">
            {t('recorder.permissionDenied')}
          </p>
          <button
            type="button"
            className="secondary-button w-full sm:w-auto text-center"
            onClick={() => void start()}
            disabled={disabled}
          >
            {t('recorder.retryPermission')}
          </button>
        </div>
      )}

      {error && <p className="m-0 text-xs text-red-500">{error}</p>}

      {audioPreviewUrl && (
        // oxlint-disable-next-line jsx-a11y/media-has-caption
        <audio
          className="w-full rounded-lg"
          controls
          src={audioPreviewUrl}
          aria-label={t('recorder.audioPreview')}
        />
      )}
    </div>
  );
}
