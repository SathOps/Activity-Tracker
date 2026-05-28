import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardHome from '../../components/dashboard/DashboardHome';
import type { Team } from '../../components/dashboard/TeamList';
import type { Intern } from '../../components/intern/InternSearch';
import {
  getCorpusRuntimeBaseUrl,
  getMembers,
  getMentorGroupMembers,
  getMentorGroups,
  getMyTeam,
  getRosterTeams,
} from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../lib/router';
import { configureCorpusService } from '../../services/corpus';
import { useConfigStore } from '../../stores/configStore';
import { useMentorGroupStore } from '../../stores/mentorGroupStore';

const CORPUS_PROXY_BASE = `${getCorpusRuntimeBaseUrl()}/corpus/proxy`;

export default function StandupWorkspace() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const authToken = useConfigStore((state) => state.corpusToken);
  const activeGroup = useMentorGroupStore((state) => state.activeGroup);
  const setActiveGroup = useMentorGroupStore((state) => state.setActiveGroup);
  const [addedInterns, setAddedInterns] = useState<Intern[]>([]);
  const [preloadedTeams, setPreloadedTeams] = useState<Team[]>([]);
  const [mentorGroupState, setMentorGroupState] = useState<
    'idle' | 'missing' | 'ready'
  >('idle');

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
      if (user?.role === 'intern') {
        const team = await getMyTeam();
        if (isCancelled) {
          return;
        }
        const interns = team.members.map(
          (member): Intern => ({
            id: member.corpus_username,
            name: member.name,
            username: member.corpus_username,
            email: member.global_email || undefined,
          })
        );
        setAddedInterns(interns);
        setPreloadedTeams(
          team.team_id
            ? [
                {
                  teamId: String(team.team_id),
                  teamName: team.team_name,
                  interns: team.members.map((member) => ({
                    internId: member.corpus_username,
                    corpusUserId: member.corpus_username,
                    internName: member.name,
                    status: 'PENDING',
                  })),
                },
              ]
            : []
        );
        return;
      }

      if (user?.role === 'mentor') {
        const groups = await getMentorGroups();

        if (isCancelled) {
          return;
        }

        if (!groups.length) {
          setMentorGroupState('missing');
          setAddedInterns([]);
          setPreloadedTeams([]);
          setActiveGroup(null);
          return;
        }

        const resolvedGroup =
          groups.find((group) => group.id === activeGroup?.id) ?? groups[0];

        if (!activeGroup || activeGroup.id !== resolvedGroup.id) {
          setActiveGroup({ id: resolvedGroup.id, name: resolvedGroup.name });
        }

        const members = await getMentorGroupMembers(resolvedGroup.id);

        if (isCancelled) {
          return;
        }

        setMentorGroupState('ready');

        const interns = members.map((member): Intern => {
          const id = member.corpus_username || String(member.id);
          return {
            id,
            name: member.name || id,
            username: id,
            email: member.email || member.global_email || undefined,
          };
        });

        setAddedInterns(interns);
        setPreloadedTeams([
          {
            teamId: `mentor-group-${resolvedGroup.id}`,
            teamName: resolvedGroup.name,
            interns: members.map((member) => ({
              internId: member.corpus_username || String(member.id),
              corpusUserId: member.corpus_username || String(member.id),
              internName: member.name || member.corpus_username,
              status: 'PENDING',
            })),
          },
        ]);
        return;
      }

      setMentorGroupState('idle');

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
  }, [activeGroup, authToken, setActiveGroup, user?.role]);

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
      {user?.role === 'mentor' && mentorGroupState === 'missing' ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-5 shadow-sm">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600">
              Mentor Group Required
            </p>
            <h3 className="text-lg font-bold text-slate-900">
              Create or select a mentor group first
            </h3>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Your standup intern list and team dashboard only show interns from
              your active mentor group. Create a group in Compliance and add the
              interns you want to monitor.
            </p>
            <button
              type="button"
              onClick={() => navigate('/compliance/mentor-groups')}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Open Mentor Groups
            </button>
          </div>
        </div>
      ) : null}
      {user?.role === 'mentor' &&
      mentorGroupState === 'ready' &&
      activeGroup ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-6 py-4 shadow-sm">
          <p className="text-sm text-blue-900">
            Monitoring active mentor group:{' '}
            <span className="font-semibold">{activeGroup.name}</span>. Change
            this in{' '}
            <button
              type="button"
              onClick={() => navigate('/compliance/mentor-groups')}
              className="font-semibold underline"
            >
              Compliance → Mentor Groups
            </button>
            .
          </p>
        </div>
      ) : null}
      <DashboardHome
        addedInterns={addedInterns}
        authToken={authToken}
        onInternsChange={setAddedInterns}
        onRemoveIntern={handleRemoveIntern}
        preloadedTeams={preloadedTeams}
        canManageInterns={user?.role === 'admin' || !!user?.canEditStandup}
      />
    </section>
  );
}
