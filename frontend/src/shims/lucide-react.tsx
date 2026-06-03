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
export const Briefcase = icon('▣');
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
export const Eye = icon('◉');
export const EyeOff = icon('○');
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
export const Trophy = icon('🏆');
export const Upload = icon('↑');
export const User = icon('👤');
export const Users = icon('👥');
export const Users2 = icon('👥');
export const X = icon('✕');
