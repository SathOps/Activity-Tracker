import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { Alert } from '../ui/Alert';
import type { ProfileReadme as ReadmeType } from '../../types';

interface Props {
  readme: ReadmeType;
  username: string;
}

export function ProfileReadme({ readme, username }: Props) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-slate-700">
        📄 Profile README
      </h3>
      {readme.exists ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-700">
              Profile README is set up correctly!
            </p>
            {readme.url && (
              <a
                href={readme.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline mt-1"
              >
                View README <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      ) : (
        <Alert variant="error" title="No profile README found">
          <p className="mb-2">
            No project named{' '}
            <code className="bg-red-100 px-1 rounded text-xs">
              {username}/{username}
            </code>{' '}
            found.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-red-700 hover:text-red-900">
              💡 How to set up a profile README
            </summary>
            <ol className="mt-2 space-y-1 text-xs pl-4 list-decimal text-red-700">
              <li>
                Create a new GitLab project with the{' '}
                <strong>exact same name as your username</strong>
              </li>
              <li>
                Add a <code className="bg-red-100 px-1 rounded">README.md</code>{' '}
                file to that project
              </li>
              <li>This README will appear on your GitLab profile page</li>
            </ol>
          </details>
        </Alert>
      )}
    </div>
  );
}
