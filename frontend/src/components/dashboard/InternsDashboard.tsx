import React, { useState } from "react";
import InternSearch, { Intern } from "../intern/InternSearch";

export interface InternsDashboardProps {
    addedInterns: Intern[];
    authToken: string;
    onInternsChange: (interns: Intern[]) => void;
    onRemoveIntern: (internId: string) => void;
}

const InternsDashboard: React.FC<InternsDashboardProps> = ({
    addedInterns,
    authToken,
    onInternsChange,
    onRemoveIntern,
}) => {
    const [listSearchQuery, setListSearchQuery] = useState("");

    const normalizedQuery = listSearchQuery.trim().toLowerCase();
    const filteredInterns = normalizedQuery
        ? addedInterns.filter(
            (intern) =>
                intern.name.toLowerCase().includes(normalizedQuery) ||
                intern.id.toLowerCase().includes(normalizedQuery)
        )
        : addedInterns;

    return (
        <div className="interns-dashboard">
            {/* ── Left: Interns List ── */}
            <section className="interns-list-panel">
                <header className="interns-list-header">
                    <h2 className="interns-list-title">
                        Interns <span className="interns-list-count">({addedInterns.length})</span>
                    </h2>
                    <input
                        type="text"
                        className="interns-list-search"
                        placeholder="Search by name or ID…"
                        aria-label="Search interns list"
                        value={listSearchQuery}
                        onChange={(e) => setListSearchQuery(e.target.value)}
                    />
                </header>

                <div className="interns-list-body">
                    {addedInterns.length === 0 ? (
                        <p className="interns-list-empty">No interns added yet. Use the search on the right to add interns.</p>
                    ) : filteredInterns.length === 0 ? (
                        <p className="interns-list-empty">No matching interns found.</p>
                    ) : (
                        <div className="interns-list-items">
                            {filteredInterns.map((intern) => (
                                <article className="interns-list-card" key={intern.id}>
                                    <div className="interns-list-card-info">
                                        <span className="interns-list-card-name">{intern.name}</span>
                                        <span className="interns-list-card-id">ID: {intern.id}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        aria-label={`Remove ${intern.name}`}
                                        title="Remove"
                                        onClick={() => onRemoveIntern(intern.id)}
                                    >
                                        ✕
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Right: Add Intern ── */}
            <aside className="interns-add-panel">
                <InternSearch
                    addedInterns={addedInterns}
                    authToken={authToken}
                    onInternsChange={onInternsChange}
                />
            </aside>
        </div>
    );
};

export default InternsDashboard;
