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
  GOOD: 'var(--slot-good-bg)',
  DELAYED: 'var(--slot-delayed-bg)',
  MISSING: 'var(--slot-missing-bg)',
  UPCOMING: 'var(--slot-upcoming-bg)',
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
    <article className="group relative overflow-hidden grid gap-2.5 bg-gradient-to-br from-[var(--surface-0)] to-[var(--surface-1)] border border-[var(--border)] rounded-xl p-3 shadow-[var(--shadow-soft)]">
      <div
        className="h-[min(192px,50vw)] w-[min(192px,50vw)] p-[clamp(11px,1.2vw,15px)] justify-self-center rounded-full"
        style={
          {
            background: `conic-gradient(from -90deg, ${ringGradient})`,
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-center bg-[var(--surface-0)] border border-[var(--border)] rounded-full h-full w-full p-2.5 text-center">
          <strong className="text-[var(--text-main)] text-[clamp(0.85rem,1.4vw,1rem)] leading-tight">
            {teamName}
          </strong>
        </div>
      </div>

      <div className="grid gap-1.5 text-center">
        <p className="text-[var(--text-subtle)] text-xs m-0">
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
            className="inline-flex items-center text-[var(--text-subtle)] text-[11px] gap-1.25"
            key={status}
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-2 w-2 rounded-full ${
                status === 'GOOD'
                  ? 'bg-[var(--slot-good-border)]'
                  : status === 'DELAYED'
                    ? 'bg-[var(--slot-delayed-border)]'
                    : status === 'MISSING'
                      ? 'bg-[var(--slot-missing-border)]'
                      : 'bg-[var(--slot-upcoming-border)]'
              }`}
            />
            {t(STATUS_LABEL_BY_KEY[status])}: {count}
          </span>
        ))}
      </div>

      <div
        className="absolute inset-0 grid gap-2 p-[18px_14px_14px] align-content-center bg-white/98 text-[var(--text-main)] pointer-events-none opacity-0 translate-y-2 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 dark:bg-black/96 dark:text-white"
        role="presentation"
      >
        <p className="border-b border-[var(--border)] text-inherit text-xs font-bold tracking-wider m-0 pb-1.5 uppercase">
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
                className="bg-[var(--surface-1)] border border-[var(--border)] rounded-full text-inherit text-xs px-2.5 py-1 dark:bg-blue-900/20"
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
