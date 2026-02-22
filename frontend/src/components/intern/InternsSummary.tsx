import React from "react";
import type { Intern } from "./InternSearch";

export interface InternsSummaryProps {
    interns: Intern[];
    onClick: () => void;
}

const InternsSummary: React.FC<InternsSummaryProps> = ({ interns, onClick }) => {
    return (
        <button
            type="button"
            className="interns-summary-card"
            onClick={onClick}
        >
            <div className="interns-summary-label">Interns</div>
            <strong className="interns-summary-count">{interns.length}</strong>
        </button>
    );
};

export default InternsSummary;
