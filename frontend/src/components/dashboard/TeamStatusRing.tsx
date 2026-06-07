import React from 'react';
import { useTranslation } from 'react-i18next';
import type { StandupSlotResult } from '../../utils/verification';

export interface TeamStatusRingProps {
  teamName: string;
  slotStatuses: StandupSlotResult[];
  memberNames: string[];
  standupCount: number;
  requiredStandupCount: number;
}

const STATUS_LABEL_BY_KEY = {
  GOOD: 'dashboard.statusOnTime',
  DELAYED: 'dashboard.statusDelayed',
  MISSING: 'dashboard.statusNotSubmitted',
  UPCOMING: 'dashboard.statusYetToCome',
} as const;

const COLOR_BY_STATUS = {
  GOOD: 'var(--ring-good)',
  DELAYED: 'var(--ring-delayed)',
  MISSING: 'var(--ring-missing)',
  UPCOMING: 'var(--ring-upcoming)',
} as const;

type SlotStatusKey = keyof typeof STATUS_LABEL_BY_KEY;

const TeamStatusRing: React.FC<TeamStatusRingProps> = ({
  teamName,
  slotStatuses,
  memberNames,
  standupCount,
  requiredStandupCount,
}) => {
  const { t } = useTranslation();
  const normalizedStatuses = React.useMemo(() => {
    if (slotStatuses.length > 0) {
      return slotStatuses.map((slot) => slot.status);
    }

    return Array.from(
      { length: Math.max(requiredStandupCount, 1) },
      () => 'UPCOMING' as const
    );
  }, [requiredStandupCount, slotStatuses]);

  const ringGradient = React.useMemo(() => {
    const segmentCount = normalizedStatuses.length;

    return normalizedStatuses
      .map((status, index) => {
        const segmentStart = (index / segmentCount) * 100;
        const segmentEnd = ((index + 1) / segmentCount) * 100;
        const segmentColor = COLOR_BY_STATUS[status];

        return `${segmentColor} ${segmentStart}% ${segmentEnd}%`;
      })
      .join(', ');
  }, [normalizedStatuses]);

  const counts = React.useMemo(() => {
    const baseCounts: Record<SlotStatusKey, number> = {
      GOOD: 0,
      DELAYED: 0,
      MISSING: 0,
      UPCOMING: 0,
    };

    for (const status of normalizedStatuses) {
      baseCounts[status] += 1;
    }

    return baseCounts;
  }, [normalizedStatuses]);

  return (
    <article className="relative overflow-hidden rounded-[20px] bg-white border border-[var(--border)] shadow-[var(--shadow-soft)] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow-hover)] dark:bg-slate-900/35 dark:border-white/5 dark:backdrop-blur-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.03)] dark:hover:border-blue-500/40 dark:hover:shadow-[0_20px_48px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.05)] group grid gap-4 p-5 sm:p-6">
      <div
        className="h-[min(192px,50vw)] w-[min(192px,50vw)] p-[clamp(11px,1.2vw,15px)] justify-self-center rounded-full"
        style={
          {
            background: `conic-gradient(from -90deg, ${ringGradient})`,
          } as React.CSSProperties
        }
      >
        <div className="transition-all duration-300 bg-[var(--surface-0)] border border-[var(--border)] flex items-center justify-center rounded-full h-full w-full p-2.5 text-center">
          <strong className="text-[var(--text-main)] text-[clamp(0.85rem,1.4vw,1rem)] leading-tight">
            {teamName}
          </strong>
        </div>
      </div>

      <div className="grid gap-1.5 text-center">
        <p className="text-[var(--text-subtle)] text-xs m-0 font-medium">
          {t('dashboard.standupsComplete', {
            completed: standupCount,
            required: requiredStandupCount,
          })}
        </p>
      </div>

      <div
        className="flex flex-wrap justify-center gap-x-2.5 gap-y-1.5"
        aria-label={t('dashboard.standupStatusSplit')}
      >
        {(
          [
            ['GOOD', counts.GOOD],
            ['DELAYED', counts.DELAYED],
            ['MISSING', counts.MISSING],
            ['UPCOMING', counts.UPCOMING],
          ] as const
        ).map(([status, count]) => (
          <span
            className="inline-flex items-center text-[var(--text-subtle)] text-[11px] gap-1"
            key={status}
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-2 w-2 rounded-full ${
                status === 'GOOD'
                  ? 'bg-[var(--ring-good)]'
                  : status === 'DELAYED'
                    ? 'bg-[var(--ring-delayed)]'
                    : status === 'MISSING'
                      ? 'bg-[var(--ring-missing)]'
                      : 'bg-[var(--ring-upcoming)]'
              }`}
            />
            {t(STATUS_LABEL_BY_KEY[status])}: {count}
          </span>
        ))}
      </div>

      <div
        className="absolute inset-0 flex flex-col gap-2.5 p-5 pt-6 sm:p-6 sm:pt-7 pointer-events-none opacity-0 translate-y-3 backdrop-blur-[20px] text-[var(--text-main)] transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] bg-white/88 border border-white/45 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 dark:text-slate-100 dark:bg-slate-900/90 dark:border-white/5"
        role="presentation"
      >
        <p className="border-b border-black/10 dark:border-white/10 text-inherit text-xs font-bold tracking-wider m-0 pb-1.5 uppercase">
          {t('dashboard.teamMembers')}
        </p>
        {memberNames.length === 0 ? (
          <p className="text-[var(--text-subtle)] text-[13px] m-0">
            {t('dashboard.noMembersAssigned')}
          </p>
        ) : (
          <ul className="grid gap-1.5 list-none mt-0.5 overflow-y-auto p-0">
            {memberNames.map((memberName) => (
              <li
                className="bg-white/45 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-full text-inherit text-xs px-2.5 py-1 backdrop-blur-sm"
                key={memberName}
              >
                {memberName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
};

export default TeamStatusRing;
