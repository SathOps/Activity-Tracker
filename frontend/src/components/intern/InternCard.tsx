import React from 'react';
import { useTranslation } from 'react-i18next';
import type { InternAudioMetadata } from '../../services/corpus/corpusService';
import { getAudioRecordUrl } from '../../services/corpus/corpusService';
import type { StandupSlotResult } from '../../utils/verification';
import StandupAudioPlayer from '../audio/StandupAudioPlayer';

export type SubmissionStatus = 'COMPLETED' | 'PENDING';

export interface InternCardProps {
  internId: string;
  internName?: string;
  todayValidCount?: number;
  slotStatuses?: StandupSlotResult[];
  standupDateLabel?: string;
  audios?: InternAudioMetadata[];
  activeAudioId?: string | null;
  onPlay?: (internId: string, audioId: string) => void;
  onPause?: () => void;
  onDeleteIntern?: (internId: string) => void;
  onUpdateIntern?: (internId: string, newName: string) => void;
}

export const InternCard: React.FC<InternCardProps> = ({
  internId,
  internName,
  todayValidCount,
  slotStatuses = [],
  standupDateLabel,
  audios = [],
  activeAudioId,
  onPlay,
  onPause,
  onDeleteIntern,
  onUpdateIntern,
}) => {
  const { t } = useTranslation();
  const displayName = (internName ?? '').trim() || t('interns.unnamedIntern');
  const visibleSlotStatuses = slotStatuses.filter(
    (slot) => slot.status === 'GOOD' || slot.status === 'DELAYED'
  );
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(displayName);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [resolvedUrls, setResolvedUrls] = React.useState<
    Record<string, string>
  >({});
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setEditedName(displayName);
  }, [displayName]);

  const handleSave = () => {
    const nextName = editedName.trim();
    if (!nextName || !onUpdateIntern) {
      setIsEditing(false);
      return;
    }

    onUpdateIntern(internId, nextName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(displayName);
    setIsEditing(false);
  };

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
    if (isExpanded && onPause) {
      onPause();
    }
  };

  const handlePlay = async (audioId: string, existingUrl?: string) => {
    // If it's a full URL, just use it
    if (
      existingUrl &&
      (existingUrl.startsWith('http') || existingUrl.startsWith('blob'))
    ) {
      onPlay?.(internId, audioId);
      return;
    }

    // Try to resolve it if it's missing or just an ID
    if (!resolvedUrls[audioId]) {
      setResolvingId(audioId);
      try {
        const url = await getAudioRecordUrl(audioId);
        if (url) {
          setResolvedUrls((prev) => ({ ...prev, [audioId]: url }));
        }
      } catch (error) {
        console.error('Failed to resolve audio URL:', error);
      } finally {
        setResolvingId(null);
      }
    }

    onPlay?.(internId, audioId);
  };

  return (
    <article className="intern-card" style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'grid', gap: 4 }}>
          <div className="intern-id">{displayName}</div>
          {isEditing ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                aria-label={t('interns.editInternNameFor', {
                  name: displayName,
                })}
                onChange={(event) => setEditedName(event.target.value)}
                style={{
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  color: 'var(--text-main)',
                  fontSize: 12,
                  backgroundColor: 'var(--glass-bg)',
                  backdropFilter: 'blur(var(--glass-blur))',
                  minWidth: 180,
                  padding: '6px 8px',
                }}
                type="text"
                value={editedName}
              />
              <button
                className="ghost-button"
                onClick={handleSave}
                type="button"
              >
                {t('button.save')}
              </button>
              <button
                className="ghost-button"
                onClick={handleCancel}
                type="button"
              >
                {t('button.cancel')}
              </button>
            </div>
          ) : (
            <>
              <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>
                {t('interns.qualifiedUploads')}
                {standupDateLabel
                  ? t('interns.onDate', { date: standupDateLabel })
                  : ''}
                : {todayValidCount ?? 0}
              </div>
              {visibleSlotStatuses.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  {visibleSlotStatuses.map((slot) => (
                    <div
                      key={slot.slotId}
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--text-main)',
                          fontSize: 12,
                          fontWeight: 600,
                          minWidth: 78,
                        }}
                      >
                        {slot.label}
                      </span>
                      <span
                        style={{
                          backgroundColor: getSlotStatusBackground(slot.status),
                          border: `1px solid ${getSlotStatusBorder(slot.status)}`,
                          borderRadius: 9999,
                          color: getSlotStatusColor(slot.status),
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                        }}
                      >
                        {slot.status}
                      </span>
                      <span
                        style={{ color: 'var(--text-subtle)', fontSize: 11 }}
                      >
                        {slot.windowLabel}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div
          className="intern-actions"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {audios.length > 0 && !isEditing && (
            <button
              className="ghost-button"
              onClick={toggleExpanded}
              style={{
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--accent)',
                border: '1px solid var(--glass-border)',
                borderRadius: 99,
                backgroundColor: isExpanded
                  ? 'var(--accent-soft)'
                  : 'var(--glass-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              type="button"
            >
              {isExpanded
                ? t('interns.hideAudios')
                : t('interns.viewAudiosCount', { count: audios.length })}
            </button>
          )}
          {onUpdateIntern ? (
            <button
              aria-label={t('interns.editAria', { name: displayName })}
              className="ghost-button"
              onClick={() => setIsEditing(true)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={t('button.edit')}
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#2563eb', width: 12, height: 12 }}
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          ) : null}
          {onDeleteIntern ? (
            <button
              aria-label={t('interns.deleteAria', { name: displayName })}
              className="ghost-button"
              onClick={() => onDeleteIntern(internId)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--danger-text)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={t('button.delete')}
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#ef4444', width: 12, height: 12 }}
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {isExpanded && (
        <section
          className="glass"
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 14,
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
          }}
        >
          {audios.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-subtle)',
                textAlign: 'center',
              }}
            >
              {t('interns.noStandupAudios')}
            </div>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: 8,
              }}
            >
              {audios.map((audio, index) => {
                const isPlaying = activeAudioId === audio.id;
                const audioDate = audio.uploadedAt
                  ? new Date(audio.uploadedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : t('interns.unknownDate');

                return (
                  <li
                    key={audio.id}
                    className="glass"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontSize: 12,
                      padding: '8px 12px',
                      background: isPlaying
                        ? 'var(--accent-soft)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: 'grid' }}>
                      <strong>
                        {t('interns.standupIndex', { index: index + 1 })}
                      </strong>
                      <span
                        style={{ color: 'var(--text-subtle)', fontSize: 11 }}
                      >
                        {audioDate}
                      </span>
                    </div>

                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {isPlaying &&
                      (resolvedUrls[audio.id] || audio.audioUrl) ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            maxWidth: 300,
                          }}
                        >
                          <StandupAudioPlayer
                            audioUrl={
                              resolvedUrls[audio.id] || audio.audioUrl || ''
                            }
                            label={t('interns.standupIndex', {
                              index: index + 1,
                            })}
                            onPause={() => onPause?.()}
                          />
                          <button
                            className="ghost-button"
                            onClick={() => onPause?.()}
                            style={{
                              padding: '4px 8px',
                              color: 'var(--danger-text)',
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 8,
                              border: '1px solid var(--danger-border)',
                              background: 'var(--danger-bg)',
                              cursor: 'pointer',
                            }}
                            title={t('audio.closePlayer')}
                            type="button"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                color: '#ef4444',
                                width: 12,
                                height: 12,
                              }}
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : resolvingId === audio.id ? (
                        <span style={{ color: 'var(--accent)', fontSize: 11 }}>
                          {t('interns.resolving')}
                        </span>
                      ) : (
                        <button
                          className="ghost-button"
                          disabled={!audio.audioUrl && !audio.id}
                          onClick={() => handlePlay(audio.id, audio.audioUrl)}
                          style={{
                            padding: '6px 14px',
                            background:
                              'linear-gradient(135deg, #2563eb, #3b82f6)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            opacity: !audio.audioUrl && !audio.id ? 0.5 : 1,
                            transition: 'all 0.2s',
                          }}
                          type="button"
                        >
                          {t('audio.play')}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </article>
  );
};

function getSlotStatusBackground(status: StandupSlotResult['status']): string {
  return `var(--slot-${status.toLowerCase()}-bg)`;
}

function getSlotStatusBorder(status: StandupSlotResult['status']): string {
  return `var(--slot-${status.toLowerCase()}-border)`;
}

function getSlotStatusColor(status: StandupSlotResult['status']): string {
  return `var(--slot-${status.toLowerCase()}-text)`;
}

export default InternCard;
