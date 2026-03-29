import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MIN_RECORDING_DURATION_SECONDS } from '../services/corpusUploadApi';
import type { RecorderSupportInfo } from '../types/corpusUpload';

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
];

interface UseRecorderResult {
  isSupported: boolean;
  selectedMimeType: string | null;
  isRecording: boolean;
  isPaused: boolean;
  audioBlob: Blob | null;
  error: string;
  durationSeconds: number;
  formattedDuration: string;
  isPermissionDenied: boolean;
  start: () => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  clear: () => void;
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function resolveRecorderSupport(): RecorderSupportInfo {
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === 'undefined'
  ) {
    return { isSupported: false, selectedMimeType: null };
  }

  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return { isSupported: true, selectedMimeType: null };
  }

  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return { isSupported: true, selectedMimeType: mimeType };
    }
  }

  return { isSupported: true, selectedMimeType: null };
}

export function useRecorder(): UseRecorderResult {
  const supportInfo = useMemo(resolveRecorderSupport, []);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isCancellingRef = useRef(false);
  const isStartingRef = useRef(false);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    setAudioBlob(null);
    setError('');
    setDurationSeconds(0);
    setIsPermissionDenied(false);
  }, []);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return;
    }

    recorder.stop();
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      return;
    }

    recorder.pause();
    setIsPaused(true);

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'paused') {
      return;
    }

    recorder.resume();
    setIsPaused(false);
    recordingStartRef.current = Date.now() - durationSeconds * 1000;

    intervalRef.current = window.setInterval(() => {
      const startedAt = recordingStartRef.current;
      if (!startedAt) {
        return;
      }

      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setDurationSeconds(elapsed);
    }, 250);
  }, [durationSeconds]);

  const cancel = useCallback(() => {
    isCancellingRef.current = true;
    setAudioBlob(null);
    setDurationSeconds(0);
    setError('Recording canceled.');
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (!supportInfo.isSupported || isStartingRef.current || isRecording) {
      if (!supportInfo.isSupported) {
        setError('Audio recording is not supported in this browser.');
      }
      return;
    }

    isStartingRef.current = true;

    try {
      setError('');
      setAudioBlob(null);
      setDurationSeconds(0);
      setIsPermissionDenied(false);
      chunksRef.current = [];
      isCancellingRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = supportInfo.selectedMimeType
        ? new MediaRecorder(stream, { mimeType: supportInfo.selectedMimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearTimer();

        const startedAt = recordingStartRef.current;
        const elapsed =
          startedAt !== null
            ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
            : durationSeconds;
        setDurationSeconds(elapsed);

        const blobType =
          supportInfo.selectedMimeType ??
          chunksRef.current[0]?.type ??
          'audio/webm';

        if (
          !isCancellingRef.current &&
          elapsed >= MIN_RECORDING_DURATION_SECONDS
        ) {
          const blob = new Blob(chunksRef.current, { type: blobType });
          setAudioBlob(blob);
          setError('');
        } else if (!isCancellingRef.current) {
          setAudioBlob(null);
          setError('Audio must be at least 10 seconds long.');
        }

        cleanupStream();
        mediaRecorderRef.current = null;
        recordingStartRef.current = null;
        chunksRef.current = [];
        isCancellingRef.current = false;
      };

      mediaRecorderRef.current = recorder;
      recordingStartRef.current = Date.now();
      setDurationSeconds(0);
      recorder.start(500);
      setIsRecording(true);

      intervalRef.current = window.setInterval(() => {
        const startedAt = recordingStartRef.current;
        if (!startedAt) {
          return;
        }

        const elapsed = Math.max(
          0,
          Math.floor((Date.now() - startedAt) / 1000)
        );
        setDurationSeconds(elapsed);
      }, 250);
    } catch (err) {
      const isPermissionError =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError');

      if (isPermissionError) {
        setError(
          'Microphone permission denied. Please allow access and retry.'
        );
        setIsPermissionDenied(true);
      } else {
        setError(
          'Unable to start recording. Please check microphone permission.'
        );
      }

      setIsRecording(false);
      clearTimer();
      cleanupStream();
    } finally {
      isStartingRef.current = false;
    }
  }, [
    cleanupStream,
    clearTimer,
    durationSeconds,
    isRecording,
    supportInfo.isSupported,
    supportInfo.selectedMimeType,
  ]);

  useEffect(() => {
    return () => {
      clearTimer();

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }

      cleanupStream();
    };
  }, [cleanupStream, clearTimer]);

  return {
    isSupported: supportInfo.isSupported,
    selectedMimeType: supportInfo.selectedMimeType,
    isRecording,
    isPaused,
    audioBlob,
    error,
    durationSeconds,
    formattedDuration: formatDuration(durationSeconds),
    isPermissionDenied,
    start,
    stop,
    pause,
    resume,
    cancel,
    clear,
  };
}
