import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

type ToastKind = 'success' | 'error';

interface ToastEntry {
  id: number;
  kind: ToastKind;
  message: string;
}

type ToastListener = (entry: ToastEntry) => void;

let nextId = 1;
const listeners = new Set<ToastListener>();

function emit(kind: ToastKind, message: string): void {
  const entry = {
    id: nextId++,
    kind,
    message,
  };

  for (const listener of listeners) {
    listener(entry);
  }
}

const toast = {
  success(message: string) {
    emit('success', message);
  },
  error(message: string) {
    emit('error', message);
  },
};

export default toast;

export function Toaster(): ReactElement {
  const [entries, setEntries] = useState<ToastEntry[]>([]);

  useEffect(() => {
    const listener: ToastListener = (entry) => {
      setEntries((prev) => [...prev, entry]);
      window.setTimeout(() => {
        setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      }, 4000);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`toast-item toast-${entry.kind}`}
          role="status"
        >
          {entry.message}
        </div>
      ))}
    </div>
  );
}
