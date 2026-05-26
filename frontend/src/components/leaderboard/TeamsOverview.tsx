/**
 * TeamsOverview — read-only display of teams loaded from the DB roster.
 * Team editing is done via the Roster Management page.
 */

import { Users } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { Team } from '../../types';

interface Props {
  teams: Team[];
}

export function TeamsOverview({ teams }: Props) {
  if (!teams.length)
    return (
      <p className="text-sm text-slate-400 italic py-4">
        No teams found in roster.
      </p>
    );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">
        📋 Roster Teams ({teams.length})
      </h3>
      {teams.map((team, idx) => (
        <div
          key={`${team.team_name}-${idx}`}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Users size={16} className="text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm">
                {team.team_name}
              </p>
              {team.project_name && (
                <p className="text-xs text-slate-400 truncate">
                  {team.project_name}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                {team.members.slice(0, 5).map((m) => (
                  <Badge
                    key={m.username}
                    variant="info"
                    className="text-[10px]"
                  >
                    @{m.username}
                  </Badge>
                ))}
                {team.members.length > 5 && (
                  <Badge variant="default" className="text-[10px]">
                    +{team.members.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Badge variant="default">{team.members.length} members</Badge>
        </div>
      ))}
    </div>
  );
}
