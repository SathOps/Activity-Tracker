import { useEffect, useRef, useState } from 'react';
import {
  Clock,
  GitCommit,
  GitMerge,
  AlertCircle,
  Download,
  Mic,
  Play,
  Pause,
  ExternalLink,
  Video,
} from 'lucide-react';
import { downloadJson } from '../../services/api/upload';
import {
  getWeeklyPerformance,
  getWeeklyPerformanceBatch,
} from '../../services/api/weekly';
import { useAuth } from '../../contexts/AuthContext';
import {
  HierarchicalSelector,
  type SelectorOutput,
} from '../shared/HierarchicalSelector';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { MetricCard } from '../ui/MetricCard';
import { cn, toDisplayText } from '../../lib/utils';
import type {
  WeeklyActivity,
  DailyData,
  EventDetail,
  CommitEntry,
} from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSeconds(secs: number): string {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isVideoUrl(url: string): boolean {
  return (
    /\.(mp4|webm|mov|avi|mkv|ogv)(\?|$)/i.test(url) ||
    url.includes('video') ||
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com')
  );
}

const OFFICE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const HOUR_LABELS: Record<number, string> = {
  9: '9 AM',
  10: '10 AM',
  11: '11 AM',
  12: '12 PM',
  13: '1 PM',
  14: '2 PM',
  15: '3 PM',
  16: '4 PM',
  17: '5 PM',
};

const EVENT_COLOURS: Record<string, string> = {
  commit: 'bg-blue-500',
  mr: 'bg-purple-500',
  issue: 'bg-amber-500',
};

// ── Hour cell ─────────────────────────────────────────────────────────────────

function HourCell({
  hour,
  events,
  active,
}: {
  hour: number;
  events: EventDetail[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasEvents = events.length > 0;

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => hasEvents && setOpen((o) => !o)}
        title={`${HOUR_LABELS[hour]}${events.length ? ` — ${events.length} event(s)` : ''}`}
        className={cn(
          'relative h-8 w-full rounded-md text-[9px] font-bold transition-all border flex items-center justify-center',
          hasEvents ? 'cursor-pointer' : 'cursor-default',
          active
            ? 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700 text-white shadow-[0_1px_4px_rgba(34,197,94,0.4)] hover:opacity-90'
            : 'bg-white/30 dark:bg-slate-950/15 border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-slate-600 hover:bg-white/50 dark:hover:bg-slate-800/30 backdrop-blur-[2px]'
        )}
      >
        {active && events.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white dark:bg-slate-900 text-[8px] font-bold text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800 flex items-center justify-center shadow-md leading-none">
            {events.length}
          </span>
        )}
        {active ? '●' : ''}
      </button>

      {/* Popover */}
      {open && hasEvents && (
        <div className="absolute z-50 left-0 top-10 w-72 rounded-xl border border-white/20 dark:border-white/5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-xl p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            {HOUR_LABELS[hour]} · {events.length} event
            {events.length > 1 ? 's' : ''}
          </p>
          {events.map((e, i) => (
            <a
              key={i}
              href={e.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white/50 dark:hover:bg-slate-800/50 group"
              title={e.title}
            >
              <span
                className={cn(
                  'mt-0.5 h-2 w-2 rounded-full flex-shrink-0',
                  EVENT_COLOURS[e.type] ?? 'bg-slate-400'
                )}
              />
              <span className="flex-1 text-xs text-slate-700 dark:text-slate-350 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-snug">
                {e.title}
              </span>
              <ExternalLink
                size={10}
                className="flex-shrink-0 mt-0.5 text-slate-300 dark:text-slate-650 group-hover:text-blue-400"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Audio / Video record ──────────────────────────────────────────────────────

function MediaRecord({
  record,
  index,
}: {
  record: Record<string, unknown>;
  index: number;
}) {
  const url = toDisplayText(record.url ?? '');
  const label = record.filename
    ? toDisplayText(record.filename)
    : record.title
      ? toDisplayText(record.title)
      : `Recording ${index + 1}`;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  if (!url) return null;

  if (isVideoUrl(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-lg border border-purple-200/50 dark:border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/15 px-3 py-2 text-xs text-purple-800 dark:text-purple-300 hover:bg-purple-500/10 dark:hover:bg-purple-950/25 transition-colors group backdrop-blur-sm"
        title={label}
      >
        <Video size={12} className="flex-shrink-0 text-purple-500" />
        <span className="flex-1 truncate">{label}</span>
        <ExternalLink
          size={10}
          className="flex-shrink-0 text-purple-400 dark:text-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-300"
        />
      </a>
    );
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
    setPlaying((p) => !p);
  }

  function handleTimeUpdate() {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    setProgress((el.currentTime / el.duration) * 100);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const pct = Number(e.target.value);
    el.currentTime = (pct / 100) * el.duration;
    setProgress(pct);
  }

  return (
    <div className="rounded-lg border border-indigo-200/50 dark:border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/15 px-3 py-2 space-y-1.5 backdrop-blur-sm">
      {/* Title + open-in-browser link */}
      <div className="flex items-center gap-2">
        <Mic
          size={11}
          className="flex-shrink-0 text-indigo-500 dark:text-indigo-400"
        />
        <span
          className="flex-1 text-xs text-indigo-800 dark:text-indigo-300 truncate"
          title={label}
        >
          {label}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          title="Open in browser"
          className="text-indigo-400 hover:text-indigo-700"
        >
          <ExternalLink size={10} />
        </a>
      </div>

      {/* Player controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 flex-shrink-0 transition-colors"
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={12} /> : <Play size={12} />}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={progress}
          onChange={handleSeek}
          className="flex-1 h-1 accent-indigo-600 cursor-pointer"
        />

        {duration > 0 && (
          <span className="text-[9px] text-indigo-500 flex-shrink-0 tabular-nums">
            {Math.floor(((progress / 100) * duration) / 60)}:
            {String(Math.floor(((progress / 100) * duration) % 60)).padStart(
              2,
              '0'
            )}
            {' / '}
            {Math.floor(duration / 60)}:
            {String(Math.floor(duration % 60)).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />
    </div>
  );
}

// ── Day row ───────────────────────────────────────────────────────────────────

function DayRow({
  date,
  day,
  commits = [],
}: {
  date: string;
  day: DailyData;
  commits?: CommitEntry[];
}) {
  const gl = day.gitlab;
  // Normalise to strings so Set.has() works regardless of whether
  // the backend returns numbers or strings in active_hours.
  const activeHoursSet = new Set(gl.active_hours.map(String));
  const mediaRecords: Record<string, unknown>[] = day.corpus?.audio_urls ?? [];
  const hasActivity =
    gl.commits > 0 || gl.mrs > 0 || gl.issues > 0 || gl.active_hours.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 space-y-3 transition-colors backdrop-blur-md shadow-sm',
        hasActivity
          ? 'border-green-500/20 dark:border-green-500/15 bg-green-500/5 dark:bg-green-950/15 shadow-green-500/5'
          : 'border-slate-200/50 dark:border-white/5 bg-white/45 dark:bg-slate-900/45 shadow-black/5'
      )}
    >
      {/* Date header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {hasActivity && (
            <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
          )}
          <p
            className={cn(
              'text-sm font-semibold',
              hasActivity
                ? 'text-slate-800 dark:text-slate-100'
                : 'text-slate-400 dark:text-slate-500'
            )}
          >
            {formatDate(date)}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] flex-wrap">
          <span
            className={cn(
              'flex items-center gap-1',
              gl.commits > 0
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-300 dark:text-slate-650'
            )}
          >
            <GitCommit size={10} /> {gl.commits} commits
          </span>
          <span
            className={cn(
              'flex items-center gap-1',
              gl.mrs > 0
                ? 'text-purple-600 dark:text-purple-400 font-semibold'
                : 'text-slate-300 dark:text-slate-650'
            )}
          >
            <GitMerge size={10} /> {gl.mrs} MRs
          </span>
          <span
            className={cn(
              'flex items-center gap-1',
              gl.issues > 0
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-slate-300 dark:text-slate-650'
            )}
          >
            <AlertCircle size={10} /> {gl.issues} issues
          </span>
          <span
            className={cn(
              'flex items-center gap-1',
              gl.time_spent_seconds > 0
                ? 'text-slate-600 dark:text-slate-350'
                : 'text-slate-300 dark:text-slate-650'
            )}
          >
            <Clock size={10} /> {formatSeconds(gl.time_spent_seconds)}
          </span>
          {mediaRecords.length > 0 && (
            <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 font-semibold">
              <Mic size={10} /> {mediaRecords.length} recording
              {mediaRecords.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Hour grid */}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${OFFICE_HOURS.length}, 1fr)` }}
      >
        {OFFICE_HOURS.map((hr) => {
          const events: EventDetail[] = (gl.events_by_hour[String(hr)] ??
            []) as EventDetail[];
          // active_hours may contain numbers or strings — check both,
          // and fall back to events presence so a slot is never grayed out
          // when it clearly has activity.
          const active = activeHoursSet.has(String(hr)) || events.length > 0;
          return (
            <HourCell key={hr} hour={hr} active={active} events={events} />
          );
        })}
      </div>

      {/* Hour labels */}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${OFFICE_HOURS.length}, 1fr)` }}
      >
        {OFFICE_HOURS.map((hr) => (
          <span
            key={hr}
            className="text-center text-[8px] text-slate-400 dark:text-slate-500"
          >
            {HOUR_LABELS[hr]}
          </span>
        ))}
      </div>

      {/* Media records */}
      {mediaRecords.length > 0 && (
        <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Recordings ({mediaRecords.length})
          </p>
          {mediaRecords.map((rec, i) => (
            <MediaRecord key={i} record={rec} index={i} />
          ))}
        </div>
      )}

      {/* Commits */}
      {commits.length > 0 && (
        <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Commits ({commits.length})
          </p>
          {commits.map((c, i) => (
            <a
              key={i}
              href={c.web_url || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white/50 dark:hover:bg-slate-800/30 group"
            >
              <GitCommit
                size={10}
                className="mt-0.5 flex-shrink-0 text-blue-400"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 dark:text-slate-350 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-snug">
                  {c.message}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {c.project_name} · {c.time}
                  {c.sha ? ` · ${c.sha.slice(0, 7)}` : ''}
                </p>
              </div>
              <ExternalLink
                size={10}
                className="flex-shrink-0 mt-0.5 text-slate-300 dark:text-slate-650 group-hover:text-blue-400"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Summary metrics ───────────────────────────────────────────────────────────

function SummaryCards({ activity }: { activity: WeeklyActivity }) {
  const days = Object.values(activity.daily_data);
  const totalCommits = days.reduce((s, d) => s + d.gitlab.commits, 0);
  const totalMrs = days.reduce((s, d) => s + d.gitlab.mrs, 0);
  const totalIssues = days.reduce((s, d) => s + d.gitlab.issues, 0);
  const totalAudio = days.reduce(
    (s, d) => s + (d.corpus?.audio_urls?.length ?? 0),
    0
  );
  const activeDays = days.filter(
    (d) => d.gitlab.commits > 0 || d.gitlab.mrs > 0 || d.gitlab.issues > 0
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      <MetricCard
        label="Total Time"
        value={formatSeconds(activity.total_weekly_time)}
      />
      <MetricCard label="Commits" value={totalCommits} />
      <MetricCard label="MRs" value={totalMrs} />
      <MetricCard label="Issues" value={totalIssues} />
      <MetricCard label="Active Days" value={`${activeDays}/${days.length}`} />
      <MetricCard label="Recordings" value={totalAudio} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WeeklyPerformance() {
  const { user } = useAuth();
  const isIntern = user?.role === 'intern';

  const [results, setResults] = useState<WeeklyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [commitsMap, setCommitsMap] = useState<Map<string, CommitEntry[]>>(
    new Map()
  );

  async function handleRun(output: SelectorOutput) {
    if (!output.users.length) return;

    setIsLoading(true);
    setFetchError(null);
    setResults([]);
    setCommitsMap(new Map());
    setActiveTab(0);

    try {
      if (output.users.length === 1) {
        const result = await getWeeklyPerformance({
          start_date: output.startDate,
          end_date: output.endDate,
          include_commits: true,
        });
        setResults([result]);
        setCommitsMap(
          new Map([[result.gitlab_username, result.commits ?? []]])
        );
      } else {
        const batchResults = await getWeeklyPerformanceBatch({
          interns: output.users.map((appUser) => ({
            gitlab_username: appUser.gitlab_username,
          })),
          start_date: output.startDate,
          end_date: output.endDate,
          include_commits: true,
        });
        setResults(batchResults);
        setCommitsMap(
          new Map(
            batchResults.map((result) => [
              result.gitlab_username,
              result.commits ?? [],
            ])
          )
        );
      }
    } catch (e) {
      setFetchError((e as Error).message ?? 'Failed to fetch activity');
    } finally {
      setIsLoading(false);
    }
  }

  const activeResult = results[activeTab] ?? null;

  // Group commits by date for the currently active intern tab
  const commitsByDate = new Map<string, CommitEntry[]>();
  if (activeResult) {
    for (const c of commitsMap.get(activeResult.gitlab_username) ?? []) {
      const bucket = commitsByDate.get(c.date) ?? [];
      bucket.push(c);
      commitsByDate.set(c.date, bucket);
    }
  }

  const sortedDates = activeResult
    ? Object.keys(activeResult.daily_data).sort()
    : [];
  const activeDayCount = sortedDates.filter((d) => {
    const gl = activeResult!.daily_data[d].gitlab;
    return (
      gl.commits > 0 ||
      gl.mrs > 0 ||
      gl.issues > 0 ||
      gl.active_hours.length > 0
    );
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Weekly Performance Tracker
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {isIntern
            ? 'Your daily GitLab activity, active hours, and standup recordings.'
            : 'Per-day breakdown — commits, MRs, issues, time, active hours, and recordings.'}
        </p>
      </div>

      <HierarchicalSelector
        runLabel="Fetch Activity"
        isRunning={isLoading}
        onRun={(output) => {
          void handleRun(output);
        }}
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {fetchError && (
        <Alert variant="error" title="Failed to fetch activity">
          {fetchError}
        </Alert>
      )}

      {results.length > 0 && !isLoading && (
        <div className="space-y-4">
          {/* Intern tabs — only shown when multiple selected */}
          {results.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {results.map((r, i) => (
                <button
                  key={r.gitlab_username}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors backdrop-blur-sm',
                    i === activeTab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200/50 dark:border-white/5 bg-white/35 dark:bg-slate-900/35 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-850/50'
                  )}
                >
                  {r.intern_name || r.gitlab_username}
                </button>
              ))}
            </div>
          )}

          {activeResult && (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {activeResult.intern_name}
                    <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                      @{activeResult.gitlab_username}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {sortedDates[0]} → {sortedDates[sortedDates.length - 1]}
                    {' · '}
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {activeDayCount} active
                    </span>
                    {' / '}
                    {sortedDates.length} days
                    {activeResult.audio_fetched && (
                      <span className="ml-2 text-indigo-500 dark:text-indigo-400">
                        · recordings fetched
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadJson(
                      activeResult,
                      `weekly_${activeResult.gitlab_username}.json`
                    )
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200/50 dark:border-white/10 bg-white/30 dark:bg-slate-900/30 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-white/55 dark:hover:bg-slate-800/50 transition-colors backdrop-blur-sm shadow-sm"
                >
                  <Download size={13} /> Export JSON
                </button>
              </div>

              <SummaryCards activity={activeResult} />

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white/25 dark:bg-slate-950/15 border border-white/20 dark:border-white/5 backdrop-blur-md px-4 py-2.5 text-[10px] text-slate-500 dark:text-slate-400 shadow-sm shadow-black/5">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Legend:
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-gradient-to-b from-green-400 to-green-600 inline-block" />
                  Active hour (click to see events)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                  Commit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
                  Merge Request
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                  Issue
                </span>
                <span className="flex items-center gap-1.5">
                  <Mic
                    size={10}
                    className="text-indigo-500 dark:text-indigo-400"
                  />{' '}
                  Audio recording
                </span>
                <span className="flex items-center gap-1.5">
                  <Video
                    size={10}
                    className="text-purple-500 dark:text-purple-400"
                  />{' '}
                  Video link
                </span>
              </div>

              {/* Day rows */}
              {sortedDates.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No activity found in this date range.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedDates.map((date) => (
                    <DayRow
                      key={date}
                      date={date}
                      day={activeResult.daily_data[date]}
                      commits={commitsByDate.get(date)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
