import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { MetricCard } from '../ui/MetricCard';
import type { ProjectEntry } from '../../types';

interface Props {
  personal: ProjectEntry[];
  contributed: ProjectEntry[];
}

function ProjectList({
  projects,
  label,
}: {
  projects: ProjectEntry[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  if (!projects.length) return null;
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800"
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {open ? 'Hide' : 'View'} {label} ({projects.length})
      </button>
      {open && (
        <ul className="mt-2 space-y-1 pl-2 border-l-2 border-brand-100">
          {projects.map((p) => (
            <li
              key={p.id}
              className="text-xs text-slate-600 flex items-center gap-1"
            >
              <a
                href={p.web_url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-600 hover:underline truncate max-w-xs"
              >
                {p.name_with_namespace}
              </a>
              <ExternalLink
                size={10}
                className="text-slate-300 flex-shrink-0"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProjectsPanel({ personal, contributed }: Props) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-slate-700">📦 Projects</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <MetricCard label="Personal Projects" value={personal.length} />
          <ProjectList projects={personal} label="personal projects" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <MetricCard label="Contributed Projects" value={contributed.length} />
          <ProjectList projects={contributed} label="contributed projects" />
        </div>
      </div>
    </div>
  );
}
