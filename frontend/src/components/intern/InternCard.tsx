import React from "react";

export type SubmissionStatus = "COMPLETED" | "PENDING";

export interface InternCardProps {
  internId: string;
  status: SubmissionStatus;
  onVerifySubmission?: (internId: string) => void;
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
  status,
  onVerifySubmission,
}) => {
  return (
    <article className="intern-card">
      <div className="intern-id">{internId}</div>

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
      </div>
    </article>
  );
};

export default InternCard;
