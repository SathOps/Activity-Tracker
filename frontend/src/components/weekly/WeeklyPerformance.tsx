/**
 * Weekly Performance Tracker
 *
 * Mirrors the Streamlit Weekly Performance Tracker page.
 * Shows a per-day activity grid (commits, MRs, issues, time spent, active hours)
 * for a given intern across a date range.
 *
 * If a Corpus JWT token is present in the config store, corpus audio records
 * are also fetched and displayed per day (matching Streamlit behaviour).
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  GitCommit,
  GitMerge,
  AlertCircle,
  Download,
  Mic,
} from 'lucide-react';
import { getWeeklyPerformance, downloadJson } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfigStore } from '../../stores/configStore';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { MetricCard } from '../ui/MetricCard';
import { cn, toDisplayText } from '../../lib/utils';
import type { WeeklyActivity, DailyData } from '../../types';

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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Office hours 9 AM – 5 PM
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

// ── Hour cell with popover ────────────────────────────────────────────────────

function HourCell({
  hour,
  events,
  active,
}: {
  hour: number;
  events?: { type: string; title: string; url: string }[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasEvents = events && events.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => hasEvents && setOpen(!open)}
        className={cn(
          'h-7 w-full rounded text-[9px] font-medium transition-colors border',
          active
            ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
            : 'bg-slate-50 text-slate-300 border-slate-200',
          hasEvents ? 'cursor-pointer' : 'cursor-default'
        )}
        title={HOUR_LABELS[hour]}
      >
        {active ? '●' : ''}
      </button>
      {open && hasEvents && (
        <div className="absolute z-50 left-0 top-8 w-64 rounded-lg border border-slate-200 bg-white shadow-lg p-2 space-y-1">
          <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">
            {HOUR_LABELS[hour]}
          </p>
          {events.map((e, i) => (
            <a
              key={i}
              href={e.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-slate-700 hover:text-blue-600 truncate"
              title={e.title}
            >
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full mr-1',
                  e.type === 'commit'
                    ? 'bg-blue-400'
                    : e.type === 'mr'
                      ? 'bg-purple-400'
                      : 'bg-amber-400'
                )}
              />
              {e.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Audio records panel ───────────────────────────────────────────────────────

function AudioRecords({ audioUrls }: { audioUrls: Record<string, unknown>[] }) {
  if (!audioUrls || audioUrls.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-slate-100">
      <p className="text-[10px] font-semibold text-indigo-600 mb-1 flex items-center gap-1">
        <Mic size={10} /> Corpus Recordings ({audioUrls.length})
      </p>
      <div className="space-y-1">
        {audioUrls.map((a, i) => {
          const url = toDisplayText(a.url ?? '');
          const filename = a.filename
            ? toDisplayText(a.filename)
            : `Recording ${i + 1}`;
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-indigo-700 hover:text-indigo-900 truncate"
              title={filename}
            >
              <Mic size={9} className="flex-shrink-0" />
              {filename}
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Day row ───────────────────────────────────────────────────────────────────

function DayRow({ date, day }: { date: string; day: DailyData }) {
  const gl = day.gitlab;
  const activeHoursSet = new Set(gl.active_hours);
  const audioUrls = day.corpus?.audio_urls ?? [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
      {/* Date + summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700">
          {formatDate(date)}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <GitCommit size={10} /> {gl.commits} commits
          </span>
          <span className="flex items-center gap-1">
            <GitMerge size={10} /> {gl.mrs} MRs
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle size={10} /> {gl.issues} issues
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} /> {formatSeconds(gl.time_spent_seconds)}
          </span>
          {audioUrls.length > 0 && (
            <span className="flex items-center gap-1 text-indigo-500">
              <Mic size={10} /> {audioUrls.length}
            </span>
          )}
        </div>
      </div>

      {/* Hour grid */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${OFFICE_HOURS.length}, 1fr)` }}
      >
        {OFFICE_HOURS.map((hr) => {
          const key = String(hr);
          const events = gl.events_by_hour[key] || [];
          return (
            <HourCell
              key={hr}
              hour={hr}
              active={activeHoursSet.has(hr)}
              events={events}
            />
          );
        })}
      </div>

      {/* Hour labels */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${OFFICE_HOURS.length}, 1fr)` }}
      >
        {OFFICE_HOURS.map((hr) => (
          <span key={hr} className="text-center text-[8px] text-slate-400">
            {HOUR_LABELS[hr]}
          </span>
        ))}
      </div>

      {/* Corpus audio records */}
      <AudioRecords audioUrls={audioUrls} />
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
      <MetricCard label="🎙 Recordings" value={totalAudio} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WeeklyPerformance() {
  const { user } = useAuth();
  const isIntern = user?.role === 'intern';
  const { corpusToken } = useConfigStore();

  const [username, setUsername] = useState(user?.gitlabUsername || '');
  const [corpusUid, setCorpusUid] = useState(user?.corpusUsername || '');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [submitted, setSubmitted] = useState(false);
  const [params, setParams] = useState<null | {
    gitlab_username: string;
    corpus_uid: string;
    start_date: string;
    end_date: string;
    corpus_token?: string;
  }>(null);

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['weekly', params],
    queryFn: () => getWeeklyPerformance(params!),
    enabled: !!params && submitted,
    retry: 1,
  });

  useEffect(() => {
    if (!isIntern || !user?.gitlabUsername) {
      return;
    }

    setUsername(user.gitlabUsername);
    setCorpusUid(user.corpusUsername);
  }, [isIntern, user?.corpusUsername, user?.gitlabUsername]);

  function handleLoadMine() {
    if (!user?.gitlabUsername) return;
    setUsername(user.gitlabUsername);
    setCorpusUid(user.corpusUsername);
    setParams({
      gitlab_username: user.gitlabUsername,
      corpus_uid: user.corpusUsername,
      start_date: startDate,
      end_date: endDate,
      corpus_token: corpusToken || undefined,
    });
    setSubmitted(true);
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setParams({
      gitlab_username: username.trim(),
      corpus_uid: corpusUid.trim(),
      start_date: startDate,
      end_date: endDate,
      corpus_token: corpusToken || undefined,
    });
    setSubmitted(true);
  }

  const sortedDates = data ? Object.keys(data.daily_data).sort() : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          📅 Weekly Performance Tracker
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {isIntern
            ? 'Review your own daily GitLab activity pattern, weekly consistency, and linked corpus audio uploads.'
            : 'Per-day activity breakdown — commits, MRs, issues, time spent, active hours'}
          {!isIntern && (corpusToken ? ', and corpus audio recordings.' : '.')}
        </p>
      </div>

      {/* Corpus login hint */}
      {!corpusToken && (
        <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2 text-xs text-indigo-700">
          <Mic size={13} />
          Login to Corpus in the sidebar to also see audio recordings.
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-4 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-medium text-slate-600 mb-1"
              htmlFor="weekly-gitlab-username"
            >
              GitLab Username *
            </label>
            <input
              id="weekly-gitlab-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isIntern}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="e.g. john_doe"
              required
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium text-slate-600 mb-1"
              htmlFor="weekly-corpus-uid"
            >
              Corpus UID
              <span className="ml-1 text-slate-400">
                (auto-filled from roster if blank)
              </span>
            </label>
            <input
              id="weekly-corpus-uid"
              type="text"
              value={corpusUid}
              onChange={(e) => setCorpusUid(e.target.value)}
              disabled={isIntern}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="corpus username"
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium text-slate-600 mb-1"
              htmlFor="weekly-start-date"
            >
              Start Date
            </label>
            <input
              id="weekly-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium text-slate-600 mb-1"
              htmlFor="weekly-end-date"
            >
              End Date
            </label>
            <input
              id="weekly-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {corpusToken && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5">
            <Mic size={11} /> Corpus audio records will be included in results.
          </div>
        )}

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading
            ? 'Fetching…'
            : isIntern
              ? '🔍 Fetch My Activity'
              : '🔍 Fetch Activity'}
        </button>
        {isIntern ? (
          <button
            type="button"
            onClick={handleLoadMine}
            disabled={!user?.gitlabUsername || isLoading}
            className="ml-3 rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700"
          >
            Load My Activity
          </button>
        ) : null}
      </form>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <Alert variant="error" title="Failed to fetch activity">
          {(error as Error)?.message ?? 'Unknown error'}
        </Alert>
      )}

      {data && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                {data.intern_name}
              </h3>
              <p className="text-xs text-slate-500">
                @{data.gitlab_username}
                {data.corpus_uid ? ` · corpus: ${data.corpus_uid}` : ''}
                {' · '}
                {sortedDates[0]} → {sortedDates[sortedDates.length - 1]}
                {data.audio_fetched && (
                  <span className="ml-2 text-indigo-500">🎙 corpus fetched</span>
                )}
              </p>
            </div>
            <button
              onClick={() =>
                downloadJson(data, `weekly_${data.gitlab_username}.json`)
              }
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Download size={13} /> Export JSON
            </button>
          </div>

          {/* Summary metrics */}
          <SummaryCards activity={data} />

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />{' '}
              Commit
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-400 inline-block" />{' '}
              MR
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />{' '}
              Issue
            </span>
            <span className="flex items-center gap-1">
              <Mic size={9} className="text-indigo-400" /> Corpus audio
            </span>
            <span className="text-slate-400 ml-2">
              Click a green cell to see events
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
                <DayRow key={date} date={date} day={data.daily_data[date]} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
