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
} as const;

const COLOR_BY_STATUS = {
  GOOD: 'var(--slot-good-bg)',
  DELAYED: 'var(--slot-delayed-bg)',
  MISSING: 'var(--slot-missing-bg)',
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
      () => 'MISSING' as const
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
    };

    for (const status of normalizedStatuses) {
      baseCounts[status] += 1;
    }

    return baseCounts;
  }, [normalizedStatuses]);

  return (
    <article className="team-ring-card">
      <div
        className="team-ring"
        style={
          {
            '--team-ring-gradient': `conic-gradient(from -90deg, ${ringGradient})`,
          } as React.CSSProperties
        }
      >
        <div className="team-ring-center">
          <strong className="team-ring-name">{teamName}</strong>
        </div>
      </div>

      <div className="team-ring-summary">
        <p className="team-ring-progress">
          {t('dashboard.standupsComplete', {
            completed: standupCount,
            required: requiredStandupCount,
          })}
        </p>
      </div>

      <div
        className="team-ring-legend"
        aria-label={t('dashboard.standupStatusSplit')}
      >
        {(
          [
            ['GOOD', counts.GOOD],
            ['DELAYED', counts.DELAYED],
            ['MISSING', counts.MISSING],
          ] as const
        ).map(([status, count]) => (
          <span className="team-ring-legend-item" key={status}>
            <span
              aria-hidden="true"
              className={`team-ring-dot ${status.toLowerCase()}`}
            />
            {t(STATUS_LABEL_BY_KEY[status])}: {count}
          </span>
        ))}
      </div>

      <div className="team-ring-members" role="presentation">
        <p className="team-ring-members-title">{t('dashboard.teamMembers')}</p>
        {memberNames.length === 0 ? (
          <p className="team-ring-members-empty">
            {t('dashboard.noMembersAssigned')}
          </p>
        ) : (
          <ul className="team-ring-members-list">
            {memberNames.map((memberName) => (
              <li className="team-ring-member" key={memberName}>
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
