import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StandupAudioRecorder } from './StandupAudioRecorder';
import { StandupUploadForm } from './StandupUploadForm';
import { useCorpusUpload } from '../hooks/useCorpusUpload';
import { useConfigStore } from '../stores/configStore';

interface RecordStandupModalProps {
  authToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    const decoded = atob(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function RecordStandupModal({
  authToken,
  onClose,
  onSuccess,
}: RecordStandupModalProps) {
  const { t } = useTranslation();
  const corpusUser = useConfigStore((state) => state.corpusUser);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState(0);

  const userId = useMemo(() => {
    if (authToken === 'session') {
      return corpusUser;
    }

    const payload = decodeJwtPayload(authToken);
    return (
      (typeof payload?.sub === 'string' && payload.sub) ||
      (typeof payload?.user_id === 'string' && payload.user_id) ||
      (typeof payload?.userId === 'string' && payload.userId) ||
      ''
    );
  }, [authToken, corpusUser]);

  const handleUnauthorized = useCallback(() => {
    onClose();
  }, [onClose]);

  const {
    upload,
    uploadStep,
    uploadProgress,
    uploadError,
    resetUploadState,
    isUploading,
  } = useCorpusUpload({
    token: authToken,
    userId,
    onUnauthorized: handleUnauthorized,
  });

  const handleUpload = async (
    payload: Parameters<typeof upload>[0]
  ): Promise<void> => {
    await upload(payload);
  };

  const handleSuccess = () => {
    setAudioBlob(null);
    setAudioDurationSeconds(0);
    resetUploadState();
    onSuccess();
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioDurationSeconds(0);
    resetUploadState();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isUploading) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isUploading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={t('record.standup')}
    >
      <div className="flex w-[92%] max-w-[640px] max-h-[85vh] flex-col rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 px-5 py-4">
          <h2 className="m-0 text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('record.standup')}
          </h2>
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center cursor-pointer rounded-full border-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50 transition-all active:scale-95 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            disabled={isUploading}
            aria-label={t('button.close')}
          >
            <span className="text-[17px] leading-none font-bold">✕</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5">
          <div className="grid gap-3">
            <h3 className="m-0 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              {t('recorder.stepRecord')}
            </h3>
            <StandupAudioRecorder
              disabled={!authToken}
              onAudioChange={setAudioBlob}
              onDurationChange={setAudioDurationSeconds}
            />
          </div>

          {!audioBlob && (
            <div className="flex justify-end gap-2 border-t border-slate-200/50 dark:border-white/5 pt-4 mt-6">
              <button
                type="button"
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-350 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-all duration-200 cursor-pointer outline-none active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                {t('button.close') || 'Close'}
              </button>
            </div>
          )}

          {audioBlob && (
            <div className="grid gap-3 mt-4">
              <h3 className="m-0 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                {t('upload.stepDetails')}
              </h3>
              <StandupUploadForm
                audioBlob={audioBlob}
                audioDurationSeconds={audioDurationSeconds}
                authToken={authToken}
                userId={userId}
                uploadStep={uploadStep}
                uploadProgress={uploadProgress}
                uploadError={uploadError}
                onUpload={handleUpload}
                onSuccess={handleSuccess}
                onReset={handleReset}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
