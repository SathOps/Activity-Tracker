import DashboardLayout from "./components/dashboard/DashboardLayout";
import InternSearch from "./components/intern/InternSearch";
import { Team } from "./components/dashboard/TeamList";
import { SubmissionStatus } from "./components/intern/InternCard";

export default function App() {
  return (
    <div className="app-shell">
      <InternSearch />
      <DashboardLayout />
    </div>
  );
}
