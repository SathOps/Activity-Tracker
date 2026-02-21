import React from "react";

export type SubmissionStatus = "COMPLETED" | "PENDING";

export interface InternCardProps {
  internId: string;
  internName?: string;
  status: SubmissionStatus;
  todayValidCount?: number;
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
  onVerifySubmission,
  onDeleteIntern,
  onUpdateIntern,
}) => {
  const displayName = (internName ?? "").trim() || "Unnamed Intern";
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(displayName);

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

  return (
    <article className="intern-card">
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
            Today qualified uploads: {todayValidCount ?? 0}
          </div>
        )}
      </div>

      <div className="intern-actions">
        <StatusBadge status={status} />
        {onVerifySubmission ? (
          <button
            className="ghost-button"
            onClick={() => onVerifySubmission(internId)}
            type="button"
          >
            Verify
          </button>
        ) : null}
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
    </article>
  );
};

export default InternCard;
