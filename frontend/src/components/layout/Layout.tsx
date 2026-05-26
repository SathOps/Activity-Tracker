import { Sidebar } from './Sidebar';
import { useConfigStore } from '../../stores/configStore';
import { Alert } from '../ui/Alert';

interface Props {
  children: React.ReactNode;
}

export function Layout({ children }: Props) {
  const { gitlabToken } = useConfigStore();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {!gitlabToken && (
            <Alert
              variant="warning"
              title="GitLab Token Required"
              className="mb-6"
            >
              Enter your GitLab Personal Access Token in the sidebar to get
              started. Go to <strong>GitLab → Settings → Access Tokens</strong>{' '}
              and create a token with at least{' '}
              <code className="bg-amber-100 px-1 rounded text-xs">
                read_api
              </code>{' '}
              scope.
            </Alert>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
