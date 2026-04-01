export interface CorpusUploadLocation {
  latitude: number;
  longitude: number;
}

export interface CorpusUploadPayload {
  title: string;
  description: string;
  language: string;
  audioFile: File;
  location: CorpusUploadLocation;
  durationSeconds: number;
  categoryIds: string[];
  releaseRights: string;
}

export interface CorpusUploadProgress {
  uploadedChunks: number;
  totalChunks: number;
  percentage: number;
}

export type CorpusUploadStep =
  | 'idle'
  | 'uploading'
  | 'finalizing'
  | 'success'
  | 'error';

export type CorpusUploadErrorType =
  | 'auth'
  | 'network'
  | 'timeout'
  | 'file-size'
  | 'server'
  | 'unknown';

export interface CorpusUploadError {
  type: CorpusUploadErrorType;
  message: string;
  statusCode?: number;
}

export interface RecorderSupportInfo {
  isSupported: boolean;
  selectedMimeType: string | null;
}

export interface Category {
  id: string;
  name: string;
  title: string;
  description: string;
  approved: boolean;
}

export interface LocationInfo {
  formattedAddress: string;
  country: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
}
