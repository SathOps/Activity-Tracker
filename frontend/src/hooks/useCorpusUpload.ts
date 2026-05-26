import { useMemo, useState } from 'react';
import {
  classifyCorpusApiError,
  MAX_AUDIO_FILE_SIZE_BYTES,
  MIN_RECORDING_DURATION_SECONDS,
  uploadAudioRecord,
} from '../services/corpusUploadApi';
import type {
  CorpusUploadErrorType,
  CorpusUploadPayload,
  CorpusUploadProgress,
  CorpusUploadStep,
} from '../types/corpusUpload';

interface UseCorpusUploadOptions {
  token: string;
  userId: string;
  onUnauthorized?: () => void;
}

interface UseCorpusUploadResult {
  upload: (payload: CorpusUploadPayload) => Promise<void>;
  uploadStep: CorpusUploadStep;
  uploadProgress: CorpusUploadProgress;
  uploadError: string;
  uploadErrorType: CorpusUploadErrorType | null;
  resetUploadState: () => void;
  isUploading: boolean;
}

const INITIAL_PROGRESS: CorpusUploadProgress = {
  uploadedChunks: 0,
  totalChunks: 0,
  percentage: 0,
};

export function useCorpusUpload(
  options: UseCorpusUploadOptions
): UseCorpusUploadResult {
  const { token, userId, onUnauthorized } = options;

  const [uploadStep, setUploadStep] = useState<CorpusUploadStep>('idle');
  const [uploadProgress, setUploadProgress] =
    useState<CorpusUploadProgress>(INITIAL_PROGRESS);
  const [uploadError, setUploadError] = useState('');
  const [uploadErrorType, setUploadErrorType] =
    useState<CorpusUploadErrorType | null>(null);

  const isUploading = useMemo(
    () => uploadStep === 'uploading' || uploadStep === 'finalizing',
    [uploadStep]
  );

  const resetUploadState = () => {
    setUploadStep('idle');
    setUploadError('');
    setUploadErrorType(null);
    setUploadProgress(INITIAL_PROGRESS);
  };

  const upload = async (payload: CorpusUploadPayload): Promise<void> => {
    if (!token || !userId) {
      setUploadStep('error');
      setUploadErrorType('auth');
      setUploadError('Auth token is missing. Please login again.');
      throw new Error('Auth token is missing. Please login again.');
    }

    if (payload.audioFile.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      setUploadStep('error');
      setUploadErrorType('file-size');
      setUploadError(
        'Audio file exceeds the 1GB limit. Please upload a smaller clip.'
      );
      throw new Error(
        'Audio file exceeds the 1GB limit. Please upload a smaller clip.'
      );
    }

    if (payload.durationSeconds < MIN_RECORDING_DURATION_SECONDS) {
      setUploadStep('error');
      setUploadErrorType('unknown');
      setUploadError('Audio must be at least 10 seconds long before upload.');
      throw new Error('Audio must be at least 10 seconds long before upload.');
    }

    setUploadStep('uploading');
    setUploadError('');
    setUploadErrorType(null);
    setUploadProgress(INITIAL_PROGRESS);

    try {
      await uploadAudioRecord({
        token,
        userId,
        payload,
        onChunkProgress: (progress) => {
          setUploadProgress(progress);
        },
        onUploadStage: (stage) => {
          setUploadStep(stage);
        },
        onUnauthorized: () => {
          onUnauthorized?.();
        },
      });

      setUploadStep('success');
    } catch (error) {
      const normalized = classifyCorpusApiError(error);

      if (normalized.type === 'auth') {
        onUnauthorized?.();
      }

      setUploadStep('error');
      setUploadErrorType(normalized.type);
      setUploadError(normalized.message);
      throw new Error(normalized.message);
    }
  };

  return {
    upload,
    uploadStep,
    uploadProgress,
    uploadError,
    uploadErrorType,
    resetUploadState,
    isUploading,
  };
}
