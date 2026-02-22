import React, { useState, useEffect } from "react";
import type { Intern } from "./InternSearch";

export interface InternsModalProps {
    interns: Intern[];
    onClose: () => void;
    onRemoveIntern: (internId: string) => void;
}

const InternsModal: React.FC<InternsModalProps> = ({ interns, onClose, onRemoveIntern }) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Prevent background scrolling while modal is open
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredInterns = normalizedQuery
        ? interns.filter(
            (intern) =>
                intern.name.toLowerCase().includes(normalizedQuery) ||
                intern.id.toLowerCase().includes(normalizedQuery)
        )
        : interns;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-container" role="dialog" aria-modal="true" aria-label="All Interns">
                {/* ── Header ── */}
                <header className="modal-header">
                    <h2 className="modal-title">All Interns ({interns.length})</h2>
                    <button
                        type="button"
                        className="modal-close-btn"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </header>

                {/* ── Search ── */}
                <div className="modal-search">
                    <input
                        type="text"
                        placeholder="Search intern by name or ID…"
                        aria-label="Search interns"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="modal-search-input"
                    />
                </div>

                {/* ── Intern List ── */}
                <div className="modal-body">
                    {interns.length === 0 ? (
                        <p className="modal-empty">No interns added yet</p>
                    ) : filteredInterns.length === 0 ? (
                        <p className="modal-empty">No matching interns found</p>
                    ) : (
                        <div className="modal-intern-list">
                            {filteredInterns.map((intern) => (
                                <article className="intern-card" key={intern.id}>
                                    <div style={{ display: "grid", gap: 4 }}>
                                        <div className="intern-id">{intern.name}</div>
                                        <div style={{ color: "#6b7280", fontSize: 12 }}>
                                            ID: {intern.id}
                                        </div>
                                    </div>
                                    <div className="intern-actions">
                                        <button
                                            type="button"
                                            className="ghost-button"
                                            aria-label={`Remove ${intern.name}`}
                                            title="Remove"
                                            onClick={() => onRemoveIntern(intern.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InternsModal;
