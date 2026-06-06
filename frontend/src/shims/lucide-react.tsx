import type { CSSProperties, ReactNode } from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

function icon(symbol: ReactNode) {
  return function IconComponent({
    size = 16,
    className = '',
    style,
  }: IconProps) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          display: 'inline-flex',
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.max(10, Math.round(size * 0.85)),
          lineHeight: 1,
          ...style,
        }}
      >
        {symbol}
      </span>
    );
  };
}

export const AlertCircle = icon('!');
export const BarChart2 = icon('▥');
export const BarChart3 = icon('▥');
export const Briefcase = icon(
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <rect width="20" height="14" x="2" y="6" rx="2" />
  </svg>
);
export const Calendar = icon('◫');
export const Check = icon('✓');
export const CheckCircle2 = icon('✓');
export const ChevronDown = icon('▾');
export const ChevronUp = icon('▴');
export const ChevronsUpDown = icon('⇅');
export const Clock = icon('◔');
export const Copy = icon('⧉');
export const Database = icon('◫');
export const Download = icon('↓');
export const ExternalLink = icon('↗');
export const Eye = icon(
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const EyeOff = icon(
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a19.16 19.16 0 0 1 5.44-5.44M21.8 14.1A19.39 19.39 0 0 0 22 12s-3-7-10-7a10 10 0 0 0-3 1" />
    <line x1="1" y1="1" x2="23" y2="23" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const FolderSearch = icon('⌕');
export const GitCommit = icon('•');
export const GitMerge = icon('⋈');
export const Globe = icon('🌐');
export const Info = icon('i');
export const Layers = icon('☰');
export const LayoutGrid = icon('▦');
export const Loader2 = icon('◌');
export const LogOut = icon('↩');
export const Menu = icon('☰');
export const Mic = icon('🎙');
export const Moon = icon('☾');
export const Pause = icon('⏸');
export const Play = icon('▶');
export const Video = icon('🎬');
export const Plus = icon('+');
export const PlusCircle = icon('⊕');
export const RefreshCw = icon('↻');
export const RotateCcw = icon('↺');
export const Save = icon('💾');
export const Search = icon('⌕');
export const Sun = icon('☀');
export const Trash2 = icon('🗑');
export const TriangleAlert = icon('▲');
export const Trophy = icon(
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v1a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
  </svg>
);
export const Upload = icon('↑');
export const User = icon('👤');
export const Users = icon('👥');
export const Users2 = icon('👥');
export const X = icon('✕');
