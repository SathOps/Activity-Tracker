import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardHome from '../../components/dashboard/DashboardHome';
import type { Team } from '../../components/dashboard/TeamList';
import type { Intern } from '../../components/intern/InternSearch';
import { getCorpusRuntimeBaseUrl, getMembers, getRosterTeams } from '../../api';
import { configureCorpusService } from '../../services/corpus';
import { useConfigStore } from '../../stores/configStore';

const CORPUS_PROXY_BASE = `${getCorpusRuntimeBaseUrl()}/corpus/proxy`;

export default function StandupWorkspace() {
  const { t } = useTranslation();
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

  // Roster data is owned by the backend; the frontend only renders it.
  useEffect(() => {
    if (!authToken) {
      setAddedInterns([]);
      setPreloadedTeams([]);
      return;
    }

    let isCancelled = false;

    const loadRoster = async () => {
      const [members, teams] = await Promise.all([
        getMembers(),
        getRosterTeams(true),
      ]);

      if (isCancelled) {
        return;
      }

      const interns = members.map((member): Intern => {
        const identifier =
          member.corpus_username || member.gitlab_username || String(member.id);

        return {
          id: identifier,
          name: member.name || identifier,
          username: identifier,
          email: member.email || member.gitlab_email || undefined,
        };
      });

      setAddedInterns(interns);
      setPreloadedTeams(
        teams.map((team): Team => {
          const teamMembers = members.filter(
            (member) =>
              member.team_id === team.id || member.team_name === team.name
          );

          return {
            teamId: String(team.id),
            teamName: team.name,
            interns: teamMembers.map((member) => {
              const identifier =
                member.corpus_username ||
                member.gitlab_username ||
                String(member.id);

              return {
                internId: identifier,
                corpusUserId: identifier,
                internName: member.name || identifier,
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
  }, [authToken]);

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
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Standup Operations
          </p>
          <h2 className="text-xl font-bold text-slate-900">{t('app.title')}</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            Review submission progress, verify team completion, and manage daily
            standup activity from the same shared workspace.
          </p>
        </div>
      </div>
      <DashboardHome
        addedInterns={addedInterns}
        authToken={authToken}
        onInternsChange={setAddedInterns}
        onRemoveIntern={handleRemoveIntern}
        preloadedTeams={preloadedTeams}
      />
    </section>
  );
}
