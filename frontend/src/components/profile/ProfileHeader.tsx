import { ExternalLink } from 'lucide-react';
import type { GitLabUser } from '../../types';

interface Props {
  user: GitLabUser;
}

export function ProfileHeader({ user }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className="h-16 w-16 rounded-full border-2 border-brand-200 object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600 flex-shrink-0">
          {user.name?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-slate-800 truncate">
          {user.name}
        </h2>
        <p className="text-sm text-slate-500">@{user.username}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
          <span>ID: {user.id}</span>
          {user.web_url && (
            <a
              href={user.web_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-600 hover:underline"
            >
              GitLab Profile <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
