import { useEffect, useState } from "react";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import InternSearch, { Intern } from "./components/intern/InternSearch";
import { configureCorpusService } from "./services/corpus";

export default function App() {
  const [addedInterns, setAddedInterns] = useState<Intern[]>([]);

  useEffect(() => {
    // Browser requests use relative /api/v1 routes via Vite proxy.
    configureCorpusService({ baseUrl: "", useMock: false });
  }, []);

  return (
    <div className="app-shell">
      <InternSearch addedInterns={addedInterns} onInternsChange={setAddedInterns} />
      <DashboardLayout addedInterns={addedInterns} />
    </div>
  );
}
