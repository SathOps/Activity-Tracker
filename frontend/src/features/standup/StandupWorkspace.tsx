import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardHome from '../../components/dashboard/DashboardHome';
import type { Team } from '../../components/dashboard/TeamList';
import type { Intern } from '../../components/intern/InternSearch';
import {
  getCorpusRuntimeBaseUrl,
  getUsers,
  getMyTeam,
  getRosterTeams,
} from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { configureCorpusService } from '../../services/corpus';
import { useConfigStore } from '../../stores/configStore';

const CORPUS_PROXY_BASE = `${getCorpusRuntimeBaseUrl()}/corpus/proxy`;

export default function StandupWorkspace() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const authToken = useConfigStore((state) => state.corpusToken);
  const [addedInterns, setAddedInterns] = useState<Intern[]>([]);
  const [preloadedTeams, setPreloadedTeams] = useState<Team[]>([]);

  useEffect(() => {
    configureCorpusService({
      baseUrl: CORPUS_PROXY_BASE,
      useMock: false,
      authToken: '',
    });
  }, [authToken]);

  useEffect(() => {
    if (!authToken) {
      setAddedInterns([]);
      setPreloadedTeams([]);
      return;
    }

    let isCancelled = false;

    const loadRoster = async () => {
      if (user?.role === 'intern') {
        const team = await getMyTeam();
        if (isCancelled) return;
        const interns = team.users.map(
          (appUser): Intern => ({
            id: appUser.corpus_username,
            name: appUser.name,
            username: appUser.corpus_username,
            email: appUser.global_email || undefined,
          })
        );
        setAddedInterns(interns);
        setPreloadedTeams(
          team.team?.id
            ? [
                {
                  teamId: String(team.team.id),
                  teamName: team.team.name,
                  interns: team.users.map((appUser) => ({
                    internId: appUser.corpus_username,
                    corpusUserId: appUser.corpus_username,
                    internName: appUser.name,
                    status: 'PENDING',
                  })),
                },
              ]
            : []
        );
        return;
      }

      // Admin and mentor: load all users and active teams
      const [users, teams] = await Promise.all([
        getUsers(),
        getRosterTeams(true),
      ]);

      if (isCancelled) return;

      const interns = users.map((appUser): Intern => {
        const identifier =
          appUser.corpus_username ||
          appUser.gitlab_username ||
          String(appUser.id);
        return {
          id: identifier,
          name: appUser.name || identifier,
          username: identifier,
          email: appUser.email || appUser.global_email || undefined,
        };
      });

      setAddedInterns(interns);
      setPreloadedTeams(
        teams.map((team): Team => {
          const teamUsers = users.filter(
            (appUser) =>
              appUser.team_id === team.id || appUser.team_name === team.name
          );
          return {
            teamId: String(team.id),
            teamName: team.name,
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
        })
      );
    };

    void loadRoster().catch((error) => {
      if (!isCancelled) {
        console.error('Could not load roster from backend:', error);
        setAddedInterns([]);
        setPreloadedTeams([]);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [authToken, user?.role]);

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
        canManageInterns={user?.role === 'admin'}
      />
    </section>
  );
}
