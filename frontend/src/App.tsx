import DashboardLayout from "./components/dashboard/DashboardLayout";
import InternSearch from "./components/intern/InternSearch";

export default function App() {
  return (
    <div className="app-shell">
      <InternSearch />
      <DashboardLayout />
    </div>
  );
}
