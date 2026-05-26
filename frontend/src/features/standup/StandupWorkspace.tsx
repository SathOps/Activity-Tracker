import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardHome from '../../components/dashboard/DashboardHome';
import type { Team } from '../../components/dashboard/TeamList';
import type { Intern } from '../../components/intern/InternSearch';
import { configureCorpusService } from '../../services/corpus';
import { getCorpusApiBaseUrl } from '../../services/corpus/apiUrl';
import { useConfigStore } from '../../stores/configStore';
import { parseInternsCSV } from '../../utils/parseInternsCSV';
import {
  buildPreloadedTeams,
  parseTeamMembersCSV,
  parseTeamsCSV,
} from '../../utils/parseTeamSeedCSV';

const CORPUS_DEFAULT_BASE = getCorpusApiBaseUrl();

export default function StandupWorkspace() {
  const { t } = useTranslation();
  const authToken = useConfigStore((state) => state.corpusToken);
  const [addedInterns, setAddedInterns] = useState<Intern[]>([]);
  const [preloadedTeams, setPreloadedTeams] = useState<Team[]>([]);

  useEffect(() => {
    configureCorpusService({
      baseUrl: CORPUS_DEFAULT_BASE,
      useMock: false,
      authToken,
    });
  }, [authToken]);

  // Preload interns and team seed data from CSV on login success
  useEffect(() => {
    if (!authToken) {
      setPreloadedTeams([]);
      return;
    }

    let isCancelled = false;

    const preloadFromCsv = async () => {
      const [internsResult, teamsResult, teamMembersResult] =
        await Promise.allSettled([
          fetchCsvText('assets/interns.csv', ['intern_id', 'intern_name']),
          fetchCsvText('assets/teams.csv', ['team_id', 'team_name']),
          fetchCsvText('assets/team_members.csv', [
            'team_id',
            'intern_id',
            'student_name',
          ]),
        ]);

      if (isCancelled) {
        return;
      }

      const preloadedInterns =
        internsResult.status === 'fulfilled'
          ? parseInternsCSV(internsResult.value)
          : [];

      if (preloadedInterns.length > 0) {
        setAddedInterns((prev) =>
          mergeInternCollections(prev, preloadedInterns)
        );
      }

      const teamRows =
        teamsResult.status === 'fulfilled'
          ? parseTeamsCSV(teamsResult.value)
          : [];
      const teamMemberRows =
        teamMembersResult.status === 'fulfilled'
          ? parseTeamMembersCSV(teamMembersResult.value)
          : [];
      setPreloadedTeams(
        buildPreloadedTeams(teamRows, teamMemberRows, preloadedInterns)
      );

      if (internsResult.status === 'rejected') {
        console.warn(
          'Could not preload interns from CSV:',
          internsResult.reason
        );
      }

      if (teamsResult.status === 'rejected') {
        console.warn('Could not preload teams from CSV:', teamsResult.reason);
      }

      if (teamMembersResult.status === 'rejected') {
        console.warn(
          'Could not preload team members from CSV:',
          teamMembersResult.reason
        );
      }
    };

    void preloadFromCsv();

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

async function fetchCsvText(
  path: string,
  expectedHeaders: string[]
): Promise<string> {
  const normalizedPath = path.replace(/^\/+/, '');
  const candidates = buildAssetFetchCandidates(normalizedPath);
  const errorMessages: string[] = [];

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);

      if (!response.ok) {
        errorMessages.push(`${candidate} -> ${response.status}`);
        continue;
      }

      const text = await response.text();

      if (isValidCsvPayload(text, expectedHeaders)) {
        return text;
      }

      const firstLine = text.split(/\r?\n/, 1)[0] || '';
      const sanitizedFirstLine = firstLine.trim().slice(0, 80);
      errorMessages.push(
        `${candidate} -> invalid CSV payload (first line: "${sanitizedFirstLine}")`
      );
    } catch (error) {
      errorMessages.push(`${candidate} -> ${(error as Error).message}`);
    }
  }

  throw new Error(
    `CSV fetch failed for ${normalizedPath}: ${errorMessages.join(', ')}`
  );
}

function isValidCsvPayload(text: string, expectedHeaders: string[]): boolean {
  if (!text.trim()) {
    return false;
  }

  const firstLine = text
    .split(/\r?\n/, 1)[0]
    ?.replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();

  if (
    !firstLine ||
    firstLine.startsWith('<!doctype') ||
    firstLine.startsWith('<html')
  ) {
    return false;
  }

  const normalizedExpectedHeaders = expectedHeaders.map((header) =>
    header.trim().toLowerCase()
  );
  return normalizedExpectedHeaders.some((header) => firstLine.includes(header));
}

function mergeInternCollections(
  existing: Intern[],
  incoming: Intern[]
): Intern[] {
  const byId = new Map(existing.map((intern) => [intern.id, intern]));

  for (const intern of incoming) {
    if (!byId.has(intern.id)) {
      byId.set(intern.id, intern);
    }
  }

  return Array.from(byId.values());
}

function buildAssetFetchCandidates(path: string): string[] {
  const baseUrl = normalizeBaseUrl(import.meta.env.BASE_URL || '/');
  const fileName = path.split('/').pop() || path;
  const candidates = [`${baseUrl}${path}`, `/${path}`, `./${path}`];

  if (typeof window !== 'undefined') {
    const currentDirectoryPath = window.location.pathname.replace(/[^/]*$/, '');
    if (currentDirectoryPath) {
      candidates.push(`${currentDirectoryPath}${path}`);
    }

    if (window.location.pathname.includes('/dist/')) {
      candidates.push(`/dist/${path}`);
      candidates.push(`./dist/${path}`);
    }

    const assetDirectory = resolveLoadedAssetDirectory();
    if (assetDirectory) {
      candidates.push(`${assetDirectory}${path}`);
      candidates.push(`${assetDirectory}${fileName}`);
    }

    candidates.push(new URL(path, window.location.href).toString());
  }

  return Array.from(new Set(candidates));
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.trim();

  if (!trimmedBaseUrl || trimmedBaseUrl === '/') {
    return '/';
  }

  const prefixed = trimmedBaseUrl.startsWith('/')
    ? trimmedBaseUrl
    : `/${trimmedBaseUrl}`;
  return prefixed.endsWith('/') ? prefixed : `${prefixed}/`;
}

function resolveLoadedAssetDirectory(): string {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return '';
  }

  const scriptOrLink = Array.from(
    document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
      'script[src*="/assets/"],link[href*="/assets/"]'
    )
  );

  for (const element of scriptOrLink) {
    const candidateUrl =
      element instanceof HTMLScriptElement
        ? element.src
        : element instanceof HTMLLinkElement
          ? element.href
          : '';

    if (!candidateUrl) {
      continue;
    }

    try {
      const parsed = new URL(candidateUrl, window.location.href);
      const directoryPath = parsed.pathname.replace(/[^/]*$/, '');

      if (!directoryPath.includes('/assets/')) {
        continue;
      }

      return `${parsed.origin}${directoryPath}`;
    } catch {
      // Ignore malformed URLs and continue to other candidates.
    }
  }

  return '';
}
