import React from "react";
import DashboardLayout from "./DashboardLayout";
import type { Intern } from "../intern/InternSearch";

export interface TeamsDashboardProps {
    addedInterns: Intern[];
    mode?: "teams" | "status";
}

const TeamsDashboard: React.FC<TeamsDashboardProps> = ({ addedInterns, mode = "teams" }) => {
    return <DashboardLayout addedInterns={addedInterns} statusDisplay={mode === "status" ? "inline" : "modal"} />;
};

export default TeamsDashboard;
