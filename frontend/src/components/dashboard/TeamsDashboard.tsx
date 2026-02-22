import React from "react";
import DashboardLayout from "./DashboardLayout";
import type { Intern } from "../intern/InternSearch";

export interface TeamsDashboardProps {
    addedInterns: Intern[];
}

const TeamsDashboard: React.FC<TeamsDashboardProps> = ({ addedInterns }) => {
    return <DashboardLayout addedInterns={addedInterns} />;
};

export default TeamsDashboard;
