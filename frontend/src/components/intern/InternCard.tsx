import React from "react";
import type { InternAudioMetadata } from "../../services/corpus/corpusService";
import { getAudioRecordUrl } from "../../services/corpus/corpusService";

export type SubmissionStatus = "COMPLETED" | "PENDING";

export interface InternCardProps {
  internId: string;
  internName?: string;
  status: SubmissionStatus;
  todayValidCount?: number;
  standupDateLabel?: string;
  audios?: InternAudioMetadata[];
  activeAudioId?: string | null;
  onPlay?: (internId: string, audioId: string) => void;
  onPause?: () => void;
  onVerifySubmission?: (internId: string) => void;
  onDeleteIntern?: (internId: string) => void;
  onUpdateIntern?: (internId: string, newName: string) => void;
}

export interface StatusBadgeProps {
  status: SubmissionStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusClass = status === "COMPLETED" ? "completed" : "pending";

  return <span className={`status-badge ${statusClass}`}>{status}</span>;
};

export const InternCard: React.FC<InternCardProps> = ({
  internId,
  internName,
  status,
  todayValidCount,
  standupDateLabel,
  audios = [],
  activeAudioId,
  onPlay,
  onPause,
  onVerifySubmission,
  onDeleteIntern,
  onUpdateIntern,
}) => {
  const displayName = (internName ?? "").trim() || "Unnamed Intern";
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(displayName);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [resolvedUrls, setResolvedUrls] = React.useState<Record<string, string>>({});
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
    if (existingUrl && (existingUrl.startsWith("http") || existingUrl.startsWith("blob"))) {
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
        console.error("Failed to resolve audio URL:", error);
      } finally {
        setResolvingId(null);
      }
    }

    onPlay?.(internId, audioId);
  };

  return (
    <article className="intern-card" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div className="intern-id">{displayName}</div>
          {isEditing ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                aria-label={`Edit intern name for ${displayName}`}
                onChange={(event) => setEditedName(event.target.value)}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 12,
                  minWidth: 180,
                  padding: "6px 8px",
                }}
                type="text"
                value={editedName}
              />
              <button className="ghost-button" onClick={handleSave} type="button">
                Save
              </button>
              <button className="ghost-button" onClick={handleCancel} type="button">
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ color: "#4b5563", fontSize: 13 }}>
              Qualified uploads{standupDateLabel ? ` on ${standupDateLabel}` : ""}:{" "}
              {todayValidCount ?? 0}
            </div>
          )}
        </div>

        <div className="intern-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {audios.length > 0 && !isEditing && (
            <button
              className="ghost-button"
              onClick={toggleExpanded}
              style={{
                padding: "4px 8px",
                fontSize: 12,
                color: "#2563eb",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                backgroundColor: isExpanded ? "#eff6ff" : "white",
              }}
              type="button"
            >
              {isExpanded ? "Hide Audios" : `View Audios (${audios.length})`}
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

      {
        isExpanded && (
          <section
            style={{
              marginTop: 4,
              padding: 8,
              backgroundColor: "#f9fafb",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
            }}
          >
            {audios.length === 0 ? (
              <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
                No standup audios found
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {audios.map((audio, index) => {
                  const isPlaying = activeAudioId === audio.id;
                  const audioDate = audio.uploadedAt
                    ? new Date(audio.uploadedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "Unknown date";

                  return (
                    <li
                      key={audio.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        fontSize: 12,
                        padding: "4px 6px",
                        backgroundColor: isPlaying ? "#eff6ff" : "transparent",
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ display: "grid" }}>
                        <strong>Standup {index + 1}</strong>
                        <span style={{ color: "#6b7280", fontSize: 11 }}>{audioDate}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {isPlaying && (resolvedUrls[audio.id] || audio.audioUrl) ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <audio
                              autoPlay
                              controls
                              src={resolvedUrls[audio.id] || audio.audioUrl}
                              style={{ height: 24, maxWidth: 150 }}
                              onEnded={() => onPause?.()}
                            />
                            <button
                              className="ghost-button"
                              onClick={() => onPause?.()}
                              style={{ padding: 4, color: "#ef4444" }}
                              title="Close Player"
                              type="button"
                            >
                              ✕
                            </button>
                          </div>
                        ) : resolvingId === audio.id ? (
                          <span style={{ color: "#2563eb", fontSize: 11 }}>Resolving...</span>
                        ) : (
                          <button
                            className="ghost-button"
                            disabled={!audio.audioUrl && !audio.id}
                            onClick={() => handlePlay(audio.id, audio.audioUrl)}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#2563eb",
                              color: "white",
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
        )
      }
    </article >
  );
};

export default InternCard;
