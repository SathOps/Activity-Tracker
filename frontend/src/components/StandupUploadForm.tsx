import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_CATEGORY_IDS,
  MAX_AUDIO_FILE_SIZE_BYTES,
  MIN_RECORDING_DURATION_SECONDS,
  verifyLocation,
} from '../services/corpusUploadApi';
import type {
  CorpusUploadLocation,
  CorpusUploadPayload,
  CorpusUploadProgress,
  CorpusUploadStep,
  LocationInfo,
} from '../types/corpusUpload';

const MIN_TITLE_LENGTH = 8;
const MIN_TITLE_WORDS = 2;
const MIN_DESCRIPTION_LENGTH = 32;
const MIN_DESCRIPTION_WORDS = 10;
const CORPUS_LANGUAGES = [
  'assamese',
  'bengali',
  'bodo',
  'dogri',
  'gujarati',
  'hindi',
  'kannada',
  'kashmiri',
  'konkani',
  'maithili',
  'malayalam',
  'marathi',
  'meitei',
  'nepali',
  'odia',
  'punjabi',
  'sanskrit',
  'santali',
  'sindhi',
  'tamil',
  'telugu',
  'urdu',
] as const;
const LOCATION_PRESETS = [
  {
    id: 'swecha',
    label: 'Use Swecha Coordinates',
    hint: 'Swecha Office',
    latitude: 17.43599116105621,
    longitude: 78.3605121153426,
  },
  {
    id: 'iiit-hyd',
    label: 'Use IIIT Hyderabad Coordinates',
    hint: 'IIIT Hyderabad',
    latitude: 17.44792233934321,
    longitude: 78.3485249693148,
  },
] as const;

interface StandupUploadFormProps {
  audioBlob: Blob | null;
  audioDurationSeconds: number;
  authToken: string;
  userId: string;
  uploadStep: CorpusUploadStep;
  uploadProgress: CorpusUploadProgress;
  uploadError: string;
  onUpload: (payload: CorpusUploadPayload) => Promise<void>;
  onSuccess: () => void;
  onReset: () => void;
  onClose: () => void;
}

function getCurrentLocation(): Promise<CorpusUploadLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

function countMeaningfulWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.replace(/[^\p{L}\p{N}]/gu, '').length >= 2).length;
}

function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  const wordCount = countMeaningfulWords(trimmed);

  if (trimmed.length < MIN_TITLE_LENGTH) {
    return `Title must be at least ${MIN_TITLE_LENGTH} characters.`;
  }

  if (wordCount < MIN_TITLE_WORDS) {
    return 'Title must contain at least 2 meaningful words.';
  }

  return null;
}

function validateDescription(description: string): string | null {
  const trimmed = description.trim();
  const wordCount = countMeaningfulWords(trimmed);

  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    return `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
  }

  if (wordCount < MIN_DESCRIPTION_WORDS) {
    return `Description must contain at least ${MIN_DESCRIPTION_WORDS} meaningful words.`;
  }

  return null;
}

function blobFileExtension(blob: Blob): string {
  if (blob.type.includes('mp4')) {
    return 'mp4';
  }
  return 'webm';
}

export function StandupUploadForm({
  audioBlob,
  audioDurationSeconds,
  authToken,
  userId: _userId,
  uploadStep,
  uploadProgress,
  uploadError,
  onUpload,
  onSuccess,
  onReset,
  onClose,
}: StandupUploadFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [location, setLocation] = useState<CorpusUploadLocation | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [locationError, setLocationError] = useState('');
  const [locationSourceLabel, setLocationSourceLabel] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryValues, setRetryValues] = useState<{
    title: string;
    description: string;
    language: string;
  } | null>(null);

  const titleValidationError = useMemo(() => validateTitle(title), [title]);
  const descriptionValidationError = useMemo(
    () => validateDescription(description),
    [description]
  );

  const isAudioDurationValid =
    !audioBlob || audioDurationSeconds >= MIN_RECORDING_DURATION_SECONDS;
  const isFileTooLarge =
    !!audioBlob && audioBlob.size > MAX_AUDIO_FILE_SIZE_BYTES;
  const isUploading = uploadStep === 'uploading' || uploadStep === 'finalizing';

  const canUpload =
    !!audioBlob &&
    !isUploading &&
    !titleValidationError &&
    !descriptionValidationError &&
    !!language &&
    !!location &&
    isAudioDurationValid &&
    !isFileTooLarge;

  const selectedPreset = location
    ? LOCATION_PRESETS.find(
        (preset) =>
          preset.latitude === location.latitude &&
          preset.longitude === location.longitude
      )
    : undefined;

  const handleUseLocationPreset = (
    preset: (typeof LOCATION_PRESETS)[number]
  ) => {
    setLocation({
      latitude: preset.latitude,
      longitude: preset.longitude,
    });
    setLocationInfo(null);
    setLocationError('');
    setLocationSourceLabel(preset.hint);
  };

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    setLocationError('');
    setLocationInfo(null);
    setLocationSourceLabel('');

    console.log('[Location] Starting location fetch...');

    try {
      const coords = await getCurrentLocation();
      console.log('[Location] Browser geolocation success:', coords);

      try {
        const verified = await verifyLocation(
          authToken,
          coords.latitude,
          coords.longitude
        );
        console.log('[Location] Corpus verify-location success:', verified);
        setLocation({
          latitude: verified.latitude,
          longitude: verified.longitude,
        });
        setLocationInfo(verified);
        setLocationSourceLabel('Current device location');
      } catch (verifyErr) {
        console.log(
          '[Location] Corpus verify failed, using raw coords:',
          verifyErr
        );
        setLocation(coords);
        setLocationSourceLabel('Current device coordinates');
        setLocationError(
          verifyErr instanceof Error
            ? `${verifyErr.message}. Using device coordinates only.`
            : 'Location verification failed. Using device coordinates only.'
        );
      }
    } catch (geoErr) {
      console.log('[Location] Browser geolocation failed:', geoErr);
      setLocationError(
        'Unable to fetch device location. Please allow location permission and retry.'
      );
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const submit = async () => {
    if (!audioBlob) {
      setErrorMessage('Please record audio before uploading.');
      return;
    }

    if (audioDurationSeconds < MIN_RECORDING_DURATION_SECONDS) {
      setErrorMessage('Audio must be at least 10 seconds long.');
      return;
    }

    const titleError = validateTitle(title);
    if (titleError) {
      setErrorMessage(titleError);
      return;
    }

    const descriptionError = validateDescription(description);
    if (descriptionError) {
      setErrorMessage(descriptionError);
      return;
    }

    if (!language.trim()) {
      setErrorMessage('Please select a language before uploading.');
      return;
    }

    if (!location) {
      setErrorMessage('Location is required before upload.');
      return;
    }

    if (audioBlob.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      setErrorMessage(
        'Audio file exceeds the 1GB limit. Please upload a smaller clip.'
      );
      return;
    }

    setErrorMessage('');

    try {
      const extension = blobFileExtension(audioBlob);
      const fileName = `${title.trim().replace(/\s+/g, '_') || 'recording'}.${extension}`;

      const audioFile = new File([audioBlob], fileName, {
        type:
          audioBlob.type || (extension === 'mp4' ? 'audio/mp4' : 'audio/webm'),
      });

      await onUpload({
        title: title.trim(),
        description: description.trim(),
        language: language.trim(),
        audioFile,
        location,
        durationSeconds: audioDurationSeconds,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      });

      setTitle('');
      setDescription('');
      setLanguage('');
      setLocation(null);
      setLocationInfo(null);
      setLocationSourceLabel('');
      setRetryValues(null);
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Audio upload failed. Please retry.';
      setErrorMessage(message);
      setRetryValues({
        title,
        description,
        language,
      });
    }
  };

  const handleRetry = async () => {
    if (!retryValues) {
      return;
    }

    setTitle(retryValues.title);
    setDescription(retryValues.description);
    setLanguage(retryValues.language);
    setErrorMessage('');
    await submit();
  };

  return (
    <div className="grid gap-[14px]">
      <div className="grid gap-[6px]">
        <label className="text-[13px] text-[var(--text-main)] grid gap-[6px]">
          {t('upload.title')}
          <input
            type="text"
            className="auth-input"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
            placeholder={t('upload.titlePlaceholder')}
          />
        </label>
        {titleValidationError && title.trim() && (
          <p className="text-[12px] text-[var(--danger-text)] m-0">
            {titleValidationError}
          </p>
        )}
      </div>

      <div className="grid gap-[6px]">
        <label className="text-[13px] text-[var(--text-main)] grid gap-[6px]">
          {t('upload.description')}
          <textarea
            className="bg-[var(--surface-0)] border border-[var(--border)] rounded-[12px] text-[var(--text-main)] font-inherit text-[14px] min-h-[80px] p-[10px_12px] resize-y transition-[border-color box-shadow] duration-[220ms] ease-in-out w-full focus:border-[var(--accent)] focus:shadow-[var(--focus-ring)] focus:outline-none placeholder:text-[var(--text-soft)]"
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            placeholder={t('upload.descriptionPlaceholder')}
          />
        </label>
        {descriptionValidationError && description.trim() && (
          <p className="text-[12px] text-[var(--danger-text)] m-0">
            {descriptionValidationError}
          </p>
        )}
      </div>

      <div className="grid gap-[6px]">
        <label className="text-[13px] text-[var(--text-main)] grid gap-[6px]">
          {t('upload.language')}
          <select
            className="auth-input"
            value={language}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setLanguage(e.target.value)
            }
          >
            <option value="">{t('upload.selectLanguage')}</option>
            {CORPUS_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-[6px]">
        <span className="text-[13px] text-[var(--text-main)]">
          {t('upload.categories')}
        </span>
        <p className="text-[12px] text-[var(--text-soft)] m-0">
          {t('upload.standupCategories')}
        </p>
      </div>

      <div className="grid gap-[6px]">
        <span className="text-[13px] text-[var(--text-main)]">
          {t('upload.releaseRights')}
        </span>
        <p className="text-[12px] text-[var(--text-soft)] m-0">
          {t('upload.createdByMe')}
        </p>
      </div>

      <div className="grid gap-[6px]">
        <span className="text-[13px] text-[var(--text-main)]">
          {t('upload.location')}
        </span>
        <div className="flex gap-[8px]">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void handleGetLocation()}
            disabled={isFetchingLocation || isUploading}
          >
            {isFetchingLocation
              ? t('upload.fetchingLocation')
              : t('upload.useCurrentLocation')}
          </button>
        </div>
        <div className="flex flex-wrap gap-[8px] mt-[8px]">
          {LOCATION_PRESETS.map((preset) => {
            const isSelected = selectedPreset?.id === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                className={`ghost-button ${isSelected ? 'border-[var(--accent)] text-[var(--accent)]' : ''}`}
                onClick={() => handleUseLocationPreset(preset)}
                disabled={isFetchingLocation || isUploading}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <p className="text-[12px] text-[var(--text-soft)] m-0">
          If current location does not work, choose one of the saved coordinates
          above.
        </p>
        {locationInfo && (
          <p className="text-[12px] text-[var(--text-soft)] m-0">
            {locationInfo.formattedAddress ||
              `${locationInfo.city ?? ''}, ${locationInfo.state ?? ''}, ${locationInfo.country ?? ''}`}
          </p>
        )}
        {!locationInfo && locationSourceLabel && (
          <p className="text-[12px] text-[var(--text-soft)] m-0">
            {locationSourceLabel}
          </p>
        )}
        {location && !locationInfo && (
          <p className="text-[12px] text-[var(--text-soft)] m-0">
            {t('upload.location')}: {location.latitude.toFixed(5)},{' '}
            {location.longitude.toFixed(5)}
          </p>
        )}
        {locationError && (
          <p className="text-[12px] text-[var(--danger-text)] m-0">
            {locationError}
          </p>
        )}
      </div>

      {!!audioBlob && (
        <p className="text-[12px] text-[var(--text-soft)] m-0">
          {t('upload.audioDuration', {
            seconds: audioDurationSeconds.toFixed(1),
          })}
        </p>
      )}

      {!!audioBlob && !isAudioDurationValid && (
        <p className="text-[12px] text-[var(--danger-text)] m-0">
          {t('upload.tooShort')}
        </p>
      )}

      {isFileTooLarge && (
        <p className="text-[12px] text-[var(--danger-text)] m-0">
          {t('upload.tooLarge')}
        </p>
      )}

      {uploadStep === 'uploading' && (
        <p className="text-[12px] text-[var(--text-soft)] m-0">
          {t('upload.uploadingChunks', {
            uploaded: uploadProgress.uploadedChunks,
            total: uploadProgress.totalChunks,
            percentage: uploadProgress.percentage,
          })}
        </p>
      )}

      {uploadStep === 'finalizing' && (
        <p className="text-[12px] text-[var(--text-soft)] m-0">
          {t('upload.finalizing')}
        </p>
      )}

      {(errorMessage || uploadError) && (
        <p className="text-[12px] text-[var(--danger-text)] m-0">
          {errorMessage || uploadError}
        </p>
      )}

      <div className="flex flex-wrap gap-[8px] pt-[8px] border-t border-[var(--border)]">
        <button
          type="button"
          className="primary-button"
          onClick={() => void submit()}
          disabled={!canUpload}
        >
          {isUploading ? t('upload.uploading') : t('upload.uploadAudio')}
        </button>
        {(errorMessage || uploadError) && retryValues && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => void handleRetry()}
          >
            {t('upload.retryUpload')}
          </button>
        )}
        <button
          type="button"
          className="ghost-button"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          disabled={isUploading}
        >
          {t('upload.reset')}
        </button>
        <button
          type="button"
          className="ghost-button border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          disabled={isUploading}
        >
          {t('button.cancel') || 'Cancel'}
        </button>
      </div>
    </div>
  );
}
