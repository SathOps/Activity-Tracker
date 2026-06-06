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
    <article className="team-status-card group grid gap-2.5 p-3">
      <div
        className="h-[min(192px,50vw)] w-[min(192px,50vw)] p-[clamp(11px,1.2vw,15px)] justify-self-center rounded-full"
        style={
          {
            background: `conic-gradient(from -90deg, ${ringGradient})`,
          } as React.CSSProperties
        }
      >
        <div className="team-status-ring-inner flex items-center justify-center rounded-full h-full w-full p-2.5 text-center">
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

      <div className="team-status-card-overlay" role="presentation">
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
