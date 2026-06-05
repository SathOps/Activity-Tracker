import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import DashboardHome from '../../components/dashboard/DashboardHome';
import type { Team } from '../../components/dashboard/TeamList';
import type { Intern } from '../../components/intern/InternSearch';
import { getCorpusRuntimeBaseUrl } from '../../services/api/batches';
import { getStandupWorkspace } from '../../services/api/standup';
import { useAuth } from '../../contexts/AuthContext';
import { configureCorpusService } from '../../services/corpus';
import { useConfigStore } from '../../stores/configStore';

const CORPUS_PROXY_BASE = `${getCorpusRuntimeBaseUrl()}/corpus/proxy`;

export default function StandupWorkspace() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const authToken = useConfigStore((state) => state.corpusToken);

  useEffect(() => {
    configureCorpusService({
      baseUrl: CORPUS_PROXY_BASE,
      useMock: false,
      authToken: '',
    });
  }, [authToken]);

  const standupQuery = useQuery({
    queryKey: ['standup-workspace'],
    queryFn: getStandupWorkspace,
    enabled: !!authToken,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const [addedInterns, setAddedInterns] = useState<Intern[]>([]);

  const preloadedTeams = useMemo<Team[]>(() => {
    const payload = standupQuery.data?.data;
    if (!payload) {
      return [];
    }
    const allTeams = payload.teams.map((team): Team => {
      const teamUsers = payload.users.filter(
        (appUser) =>
          appUser.team_id === team.id || appUser.team_name === team.name
      );
      return {
        teamId: String(team.id),
        teamName: team.name,
        startDate: team.start_date,
        interns: teamUsers.map((appUser) => {
          const identifier =
            appUser.corpus_username ||
            appUser.gitlab_username ||
            String(appUser.id);
          return {
            internId: identifier,
            corpusUserId: identifier,
            internName: appUser.name || identifier,
            status: 'PENDING',
          };
        }),
      };
    });

    if (user?.role === 'intern') {
      const userTeamIdStr = user.teamId ? String(user.teamId) : null;
      const userTeamNameLower = user.teamName?.toLowerCase();
      return allTeams.filter(
        (team) =>
          (userTeamIdStr && team.teamId === userTeamIdStr) ||
          (userTeamNameLower &&
            team.teamName.toLowerCase() === userTeamNameLower)
      );
    }
    return allTeams;
  }, [standupQuery.data, user]);

  useEffect(() => {
    const payload = standupQuery.data?.data;
    if (!payload) {
      setAddedInterns([]);
      return;
    }
    setAddedInterns(
      payload.users.map(
        (appUser): Intern => ({
          id:
            appUser.corpus_username ||
            appUser.gitlab_username ||
            String(appUser.id),
          name: appUser.name,
          username:
            appUser.corpus_username ||
            appUser.gitlab_username ||
            String(appUser.id),
          email: appUser.email || appUser.global_email || undefined,
        })
      )
    );
  }, [standupQuery.data, user?.role]);

  const handleRemoveIntern = (internId: string) => {
    setAddedInterns((prev) => prev.filter((i) => i.id !== internId));
  };

  if (!authToken) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Standup Access
          </p>
          <h2 className="text-3xl font-bold text-slate-900">
            {t('auth.introTitle')}
          </h2>
          <p className="text-base leading-7 text-slate-600">
            {t('auth.introCopy')}
          </p>
          <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {t('auth.loginTitle')}.{' '}
            <span className="font-medium">
              Use the Corpus Login section in the sidebar to open the dashboard.
            </span>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <DashboardHome
        addedInterns={addedInterns}
        authToken={authToken}
        onInternsChange={setAddedInterns}
        onRemoveIntern={handleRemoveIntern}
        preloadedTeams={preloadedTeams}
        canManageInterns={user?.role === 'admin' || user?.role === 'intern'}
      />
    </section>
  );
}
