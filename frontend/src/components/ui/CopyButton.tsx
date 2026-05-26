import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check size={13} className="text-green-500" />
      ) : (
        <Copy size={13} />
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
