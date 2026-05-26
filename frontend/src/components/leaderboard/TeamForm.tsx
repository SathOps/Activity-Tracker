import { useState } from 'react';
import { PlusCircle, Save, X } from 'lucide-react';
import type { Team, TeamMember } from '../../types';

interface Props {
  initial?: Partial<Team>;
  onSave: (t: Team) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  title: string;
}

export function TeamForm({
  initial,
  onSave,
  onCancel,
  isLoading,
  title,
}: Props) {
  const [teamName, setTeamName] = useState(initial?.team_name ?? '');
  const [projectName, setProjectName] = useState(initial?.project_name ?? '');
  const [members, setMembers] = useState<TeamMember[]>(initial?.members ?? []);
  const [newMember, setNewMember] = useState('');
  const [error, setError] = useState('');

  function addMember() {
    const u = newMember.trim();
    if (!u) return;
    if (members.some((m) => m.username.toLowerCase() === u.toLowerCase())) {
      setError(`@${u} is already in the team.`);
      return;
    }
    setMembers([...members, { username: u }]);
    setNewMember('');
    setError('');
  }

  function removeMember(username: string) {
    setMembers(members.filter((m) => m.username !== username));
  }

  function handleSave() {
    if (!teamName.trim()) {
      setError('Team name is required.');
      return;
    }
    onSave({
      team_name: teamName.trim(),
      project_name: projectName.trim(),
      members,
      scope: 'all',
    });
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-brand-800">{title}</h3>

      {/* Team Name + Project */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs text-slate-600 mb-1"
            htmlFor="team-form-name"
          >
            Team Name *
          </label>
          <input
            id="team-form-name"
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Team Alpha"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
          />
        </div>
        <div>
          <label
            className="block text-xs text-slate-600 mb-1"
            htmlFor="team-form-project"
          >
            Project Name
          </label>
          <input
            id="team-form-project"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. group/repo-name"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
          />
        </div>
      </div>

      {/* Member list */}
      <div>
        <label
          className="block text-xs text-slate-600 mb-2"
          htmlFor="team-form-member"
        >
          Members ({members.length})
        </label>
        <div className="flex flex-wrap gap-2 mb-2 min-h-8">
          {members.map((m) => (
            <span
              key={m.username}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 pl-2.5 pr-1.5 py-1 text-xs font-medium text-slate-700"
            >
              @{m.username}
              <button
                onClick={() => removeMember(m.username)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {members.length === 0 && (
            <span className="text-xs text-slate-400 italic">
              No members yet
            </span>
          )}
        </div>

        {/* Add member input */}
        <div className="flex gap-2">
          <input
            id="team-form-member"
            value={newMember}
            onChange={(e) => {
              setNewMember(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
            placeholder="Add username…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
          />
          <button
            onClick={addMember}
            disabled={!newMember.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <PlusCircle size={13} /> Add
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={isLoading || !teamName.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <Save size={14} />
          {isLoading ? 'Saving…' : 'Save Team'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X size={14} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}
