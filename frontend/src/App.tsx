import { useState } from "react";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import InternSearch, { Intern } from "./components/intern/InternSearch";

export default function App() {
  const [addedInterns, setAddedInterns] = useState<Intern[]>([]);

  return (
    <div className="app-shell">
      <InternSearch addedInterns={addedInterns} onInternsChange={setAddedInterns} />
      <DashboardLayout addedInterns={addedInterns} />
    </div>
  );
}
