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
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={t('record.standup')}
    >
      <div className="record-modal">
        <div className="record-modal-header">
          <h2 className="record-modal-title">{t('record.standup')}</h2>
          <button
            type="button"
            className="record-modal-close"
            onClick={onClose}
            disabled={isUploading}
            aria-label={t('button.close')}
          >
            ✕
          </button>
        </div>

        <div className="record-modal-body">
          <div className="record-modal-section">
            <h3 className="record-modal-section-title">
              {t('recorder.stepRecord')}
            </h3>
            <StandupAudioRecorder
              disabled={!authToken}
              onAudioChange={setAudioBlob}
              onDurationChange={setAudioDurationSeconds}
            />
          </div>

          {audioBlob && (
            <div className="record-modal-section">
              <h3 className="record-modal-section-title">
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
