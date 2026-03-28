import React from 'react';
import type { InternAudioMetadata } from '../../services/corpus/corpusService';
import { getAudioRecordUrl } from '../../services/corpus/corpusService';
import StandupAudioPlayer from '../audio/StandupAudioPlayer';

export type SubmissionStatus = 'COMPLETED' | 'PENDING';

export interface InternCardProps {
  internId: string;
  internName?: string;
  todayValidCount?: number;
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
  standupDateLabel,
  audios = [],
  activeAudioId,
  onPlay,
  onPause,
  onDeleteIntern,
  onUpdateIntern,
}) => {
  const displayName = (internName ?? '').trim() || 'Unnamed Intern';
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
                aria-label={`Edit intern name for ${displayName}`}
                onChange={(event) => setEditedName(event.target.value)}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text-main)',
                  fontSize: 12,
                  backgroundColor: 'var(--surface-0)',
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
                Save
              </button>
              <button
                className="ghost-button"
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>
              Qualified uploads
              {standupDateLabel ? ` on ${standupDateLabel}` : ''}:{' '}
              {todayValidCount ?? 0}
            </div>
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
                padding: '4px 8px',
                fontSize: 12,
                color: 'var(--accent)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                backgroundColor: isExpanded
                  ? 'var(--accent-soft)'
                  : 'var(--surface-0)',
              }}
              type="button"
            >
              {isExpanded ? 'Hide Audios' : `View Audios (${audios.length})`}
            </button>
          )}
          {onUpdateIntern ? (
            <button
              aria-label={`Edit ${displayName}`}
              className="ghost-button"
              onClick={() => setIsEditing(true)}
              title="Edit"
              type="button"
            >
              ✎
            </button>
          ) : null}
          {onDeleteIntern ? (
            <button
              aria-label={`Delete ${displayName}`}
              className="ghost-button"
              onClick={() => onDeleteIntern(internId)}
              title="Delete"
              type="button"
            >
              🗑
            </button>
          ) : null}
        </div>
      </div>

      {isExpanded && (
        <section
          style={{
            marginTop: 4,
            padding: 8,
            backgroundColor: 'var(--surface-1)',
            borderRadius: 6,
            border: '1px solid var(--border)',
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
              No standup audios found
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
                  : 'Unknown date';

                return (
                  <li
                    key={audio.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontSize: 12,
                      padding: '4px 6px',
                      backgroundColor: isPlaying
                        ? 'var(--accent-soft)'
                        : 'transparent',
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ display: 'grid' }}>
                      <strong>Standup {index + 1}</strong>
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
                            label={`Standup ${index + 1}`}
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
                            }}
                            title="Close Player"
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                      ) : resolvingId === audio.id ? (
                        <span style={{ color: 'var(--accent)', fontSize: 11 }}>
                          Resolving...
                        </span>
                      ) : (
                        <button
                          className="ghost-button"
                          disabled={!audio.audioUrl && !audio.id}
                          onClick={() => handlePlay(audio.id, audio.audioUrl)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: 'var(--accent)',
                            color: '#ffffff',
                            borderRadius: 4,
                            fontSize: 11,
                            opacity: !audio.audioUrl && !audio.id ? 0.5 : 1,
                          }}
                          type="button"
                        >
                          Play
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

export default InternCard;
