import React, { useState } from "react";
import InternsDashboard from "./InternsDashboard";
import TeamsDashboard from "./TeamsDashboard";
import type { Team } from "./TeamList";
import type { Intern } from "../intern/InternSearch";

type ActiveView = "interns" | "teams" | "status";

export interface DashboardHomeProps {
    addedInterns: Intern[];
    preloadedTeams?: Team[];
    authToken: string;
    onInternsChange: (interns: Intern[]) => void;
    onRemoveIntern: (internId: string) => void;
}

const TABS: { key: ActiveView; label: string; icon: string }[] = [
    { key: "interns", label: "Interns", icon: "👤" },
    { key: "teams", label: "Team Dashboard", icon: "👥" },
    { key: "status", label: "Status", icon: "📊" },
];

const DashboardHome: React.FC<DashboardHomeProps> = ({
    addedInterns,
    preloadedTeams,
    authToken,
    onInternsChange,
    onRemoveIntern,
}) => {
    const [activeView, setActiveView] = useState<ActiveView>("interns");

    return (
        <>
            <nav className="view-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`view-tab${activeView === tab.key ? " view-tab--active" : ""}`}
                        onClick={() => setActiveView(tab.key)}
                        type="button"
                    >
                        <span className="view-tab-icon">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>

            {activeView === "interns" ? (
                <InternsDashboard
                    addedInterns={addedInterns}
                    authToken={authToken}
                    onInternsChange={onInternsChange}
                    onRemoveIntern={onRemoveIntern}
                />
            ) : (
                <TeamsDashboard
                    addedInterns={addedInterns}
                    mode={activeView === "status" ? "status" : "teams"}
                    preloadedTeams={preloadedTeams}
                />
            )}
        </>
    );
};

export default DashboardHome;
