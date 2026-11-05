import type {
  StandupWorkspaceResponse,
  TeamRecord,
  UserRecord,
  UserRole,
} from '../types';
import type { InternAudioMetadata, InternSummary } from './corpus/corpusService';

export interface MockUserSession {
  id: number;
  corpus_username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  institution_id?: string;
  institution_name?: string;
  gitlab_username?: string;
  team_id?: number;
  team_name?: string;
  batch_id?: number;
  batch_name?: string;
}

const DEFAULT_MOCK_TEAMS: Array<{ id: number; name: string; slug: string }> = [
  { id: 1, name: 'Dev 3', slug: 'dev-3' },
  { id: 2, name: 'Trinity', slug: 'trinity' },
  { id: 3, name: 'Sudo', slug: 'sudo' },
  { id: 4, name: 'Trishul', slug: 'trishul' },
  { id: 5, name: 'BrainStorm', slug: 'brainstorm' },
  { id: 6, name: 'Core', slug: 'core' },
  { id: 7, name: 'Magnum', slug: 'magnum' },
  { id: 8, name: 'TrioForce', slug: 'trioforce' },
  { id: 9, name: 'Techops', slug: 'techops' },
  { id: 10, name: 'Mind ops', slug: 'mind-ops' },
  { id: 11, name: 'Code-Dev', slug: 'codedev' },
  { id: 12, name: 'Vision Pair', slug: 'visionpair' },
  { id: 13, name: 'Team 2Mates', slug: 'team-2Mates' },
  { id: 14, name: 'Code Duo', slug: 'codeduo' },
  { id: 15, name: 'Tech Titans', slug: 'techtitans' },
];

const DEFAULT_MOCK_MEMBERS: Array<{
  teamSlug: string;
  internId: string;
  name: string;
}> = [
  { teamSlug: 'dev-3', internId: 'cameron_davis', name: 'Cameron Davis' },
  { teamSlug: 'dev-3', internId: 'taylor_morgan', name: 'Taylor Morgan' },
  { teamSlug: 'dev-3', internId: 'sawyer_wright', name: 'Sawyer Wright' },
  { teamSlug: 'trinity', internId: 'logan_white', name: 'Logan White' },
  { teamSlug: 'trinity', internId: 'elliott_king', name: 'Elliott King' },
  { teamSlug: 'trinity', internId: 'skyler_anderson', name: 'Skyler Anderson' },
  { teamSlug: 'sudo', internId: 'finley_martinez', name: 'Finley Martinez' },
  { teamSlug: 'sudo', internId: 'casey_taylor', name: 'Casey Taylor' },
  { teamSlug: 'sudo', internId: 'jesse_allen', name: 'Jesse Allen' },
  { teamSlug: 'trishul', internId: 'avery_carter', name: 'Avery Carter' },
  { teamSlug: 'trishul', internId: 'riley_brooks', name: 'Riley Brooks' },
  { teamSlug: 'trishul', internId: 'kai_lewis', name: 'Kai Lewis' },
  { teamSlug: 'brainstorm', internId: 'river_robinson', name: 'River Robinson' },
  { teamSlug: 'brainstorm', internId: 'jamie_hayes', name: 'Jamie Hayes' },
  { teamSlug: 'brainstorm', internId: 'dakota_miller', name: 'Dakota Miller' },
  { teamSlug: 'core', internId: 'quinn_thompson', name: 'Quinn Thompson' },
  { teamSlug: 'core', internId: 'amari_adams', name: 'Amari Adams' },
  { teamSlug: 'core', internId: 'kendall_jackson', name: 'Kendall Jackson' },
  { teamSlug: 'magnum', internId: 'alex_rivera', name: 'Alex Rivera' },
  { teamSlug: 'magnum', internId: 'harper_harris', name: 'Harper Harris' },
  { teamSlug: 'magnum', internId: 'drew_young', name: 'Drew Young' },
  { teamSlug: 'trioforce', internId: 'parker_walker', name: 'Parker Walker' },
  { teamSlug: 'trioforce', internId: 'jordan_lee', name: 'Jordan Lee' },
  { teamSlug: 'trioforce', internId: 'emerson_garcia', name: 'Emerson Garcia' },
  { teamSlug: 'techops', internId: 'rowan_thomas', name: 'Rowan Thomas' },
  { teamSlug: 'techops', internId: 'peyton_martin', name: 'Peyton Martin' },
  { teamSlug: 'techops', internId: 'dylan_hall', name: 'Dylan Hall' },
  { teamSlug: 'mind-ops', internId: 'sam_patel', name: 'Sam Patel' },
  { teamSlug: 'mind-ops', internId: 'sage_green', name: 'Sage Green' },
  { teamSlug: 'mind-ops', internId: 'reese_wilson', name: 'Reese Wilson' },
  { teamSlug: 'codedev', internId: 'corey_flores', name: 'Corey Flores' },
  { teamSlug: 'codedev', internId: 'shiloh_nelson', name: 'Shiloh Nelson' },
  { teamSlug: 'visionpair', internId: 'milan_nguyen', name: 'Milan Nguyen' },
  { teamSlug: 'visionpair', internId: 'hayden_clark', name: 'Hayden Clark' },
  { teamSlug: 'team-2Mates', internId: 'morgan_chen', name: 'Morgan Chen' },
  { teamSlug: 'team-2Mates', internId: 'devon_hill', name: 'Devon Hill' },
  { teamSlug: 'codeduo', internId: 'eden_scott', name: 'Eden Scott' },
  { teamSlug: 'codeduo', internId: 'remy_baker', name: 'Remy Baker' },
  { teamSlug: 'techtitans', internId: 'dallas_torres', name: 'Dallas Torres' },
  { teamSlug: 'techtitans', internId: 'adrian_rodriguez', name: 'Adrian Rodriguez' },
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDeterministicMockAudios(
  username: string
): InternAudioMetadata[] {
  const audios: InternAudioMetadata[] = [];
  const complianceRating = hashString(username) % 100;
  const now = new Date();

  // 4 time slots defined in IST:
  // S1: 09:00 - 09:30 (Late cutoff 10:00) -> UTC 03:30 - 04:00 (Late cutoff 04:30)
  // S2: 12:00 - 12:30 (Late cutoff 13:00) -> UTC 06:30 - 07:00 (Late cutoff 07:30)
  // S3: 14:00 - 14:30 (Late cutoff 15:00) -> UTC 08:30 - 09:00 (Late cutoff 09:30)
  // S4: 16:30 - 17:00 (Late cutoff 17:30) -> UTC 11:00 - 11:30 (Late cutoff 12:00)
  const slots = [
    { id: 'S1', good: '03:45:00.000Z', late: '04:15:00.000Z' },
    { id: 'S2', good: '06:45:00.000Z', late: '07:15:00.000Z' },
    { id: 'S3', good: '08:45:00.000Z', late: '09:15:00.000Z' },
    { id: 'S4', good: '11:15:00.000Z', late: '11:45:00.000Z' },
  ];

  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().split('T')[0];

    for (const slot of slots) {
      const randVal =
        (hashString(`${username}-${dateKey}-${slot.id}`) % 100) / 100.0;

      let goodProb = 0.75;
      let lateProb = 0.15;
      if (complianceRating >= 85) {
        goodProb = 0.95;
        lateProb = 0.04;
      } else if (complianceRating < 40 && complianceRating >= 10) {
        goodProb = 0.5;
        lateProb = 0.25;
      } else if (complianceRating < 10) {
        goodProb = 0.2;
        lateProb = 0.3;
      }

      if (randVal < goodProb) {
        audios.push({
          id: `${username}-${dateKey}-${slot.id}`,
          category: 'standup',
          tag: 'internship',
          labels: ['standup', 'internship'],
          uploadedAt: `${dateKey}T${slot.good}`,
          audioUrl:
            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        });
      } else if (randVal < goodProb + lateProb) {
        audios.push({
          id: `${username}-${dateKey}-${slot.id}`,
          category: 'standup',
          tag: 'internship',
          labels: ['standup', 'internship'],
          uploadedAt: `${dateKey}T${slot.late}`,
          audioUrl:
            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        });
      }
    }
  }

  // Include any local recordings uploaded during this session
  try {
    const localSaved = localStorage.getItem(`mock_uploads_${username}`);
    if (localSaved) {
      const records = JSON.parse(localSaved);
      if (Array.isArray(records)) {
        audios.unshift(...records);
      }
    }
  } catch {
    // Ignore localStorage read errors
  }

  return audios;
}

export function getMockStandupWorkspace(): StandupWorkspaceResponse {
  const teamRecords: TeamRecord[] = DEFAULT_MOCK_TEAMS.map((t) => ({
    id: t.id,
    name: t.name,
    batch_id: 1,
    batch_name: 'Summer Internship 2026',
    start_date: '2026-05-01',
    is_active: true,
    member_count: DEFAULT_MOCK_MEMBERS.filter((m) => m.teamSlug === t.slug).length,
  }));

  const userRecords: UserRecord[] = DEFAULT_MOCK_MEMBERS.map((m, idx) => {
    const teamObj = DEFAULT_MOCK_TEAMS.find((t) => t.slug === m.teamSlug);
    return {
      id: 100 + idx,
      name: m.name,
      corpus_username: m.internId,
      gitlab_username: m.internId,
      email: `${m.internId}@swecha.org`,
      institution_id: '1',
      institution_name: 'Swecha Academy',
      role: 'intern',
      team_id: teamObj ? teamObj.id : 1,
      team_name: teamObj ? teamObj.name : 'Dev 3',
      batch_id: 1,
      batch_name: 'Summer Internship 2026',
    };
  });

  return {
    data: {
      scope: 'mentor',
      dashboard: {},
      analytics: {},
      team: teamRecords[0] || null,
      teams: teamRecords,
      users: userRecords,
    },
  };
}

export function getMockAuthUser(phone?: string): MockUserSession {
  return {
    id: 1,
    corpus_username: 'lead_mentor',
    name: 'Lead Mentor',
    role: 'mentor',
    phone: phone || '9876543210',
    email: 'mentor@swecha.org',
    institution_id: '1',
    institution_name: 'Swecha Learning Center',
    gitlab_username: 'lead_mentor',
    team_id: 1,
    team_name: 'Dev 3',
    batch_id: 1,
    batch_name: 'Summer Internship 2026',
  };
}

export function searchMockInterns(query: string): InternSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DEFAULT_MOCK_MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(q) || m.internId.toLowerCase().includes(q)
  ).map((m) => ({
    id: m.internId,
    name: m.name,
    username: m.internId,
    email: `${m.internId}@swecha.org`,
  }));
}

export function createCorpusMockFetcher(realBaseUrl?: string) {
  return async (url: string, init?: RequestInit) => {
    // If real backend is accessible, try it first
    if (realBaseUrl && !url.includes('soundhelix')) {
      try {
        const res = await fetch(url, init);
        if (res.ok) return res;
      } catch {
        // Backend offline, fallback to mock response
      }
    }

    if (url.includes('/api/v1/categories')) {
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'c81f5d73-9090-453e-bb08-c2f46453e0bd',
            name: 'standup',
            title: 'Standup',
            approved: true,
          },
          {
            id: '4dd053f4-6323-43d4-87a3-ce1816bd9459',
            name: 'internship',
            title: 'Internship',
            approved: true,
          },
        ],
      };
    }

    if (url.includes('/api/v1/users/search')) {
      const parsed = new URL(url, 'http://localhost');
      const q = parsed.searchParams.get('query') || '';
      return {
        ok: true,
        status: 200,
        json: async () => searchMockInterns(q),
      };
    }

    if (url.includes('/contributions/audio')) {
      const match = url.match(/\/users\/([^/]+)\/contributions\/audio/);
      const userId = match ? decodeURIComponent(match[1]) : 'user';
      return {
        ok: true,
        status: 200,
        json: async () => getDeterministicMockAudios(userId),
      };
    }

    if (url.includes('/record-url')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        }),
      };
    }

    if (url.includes('/api/v1/users/')) {
      const match = url.match(/\/users\/([^/?]+)/);
      const userId = match ? decodeURIComponent(match[1]) : 'user';
      const found = DEFAULT_MOCK_MEMBERS.find((m) => m.internId === userId);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: userId,
          username: userId,
          name: found ? found.name : userId,
          email: `${userId}@swecha.org`,
          phone: '9876543210',
          institution_id: '1',
          college_name: 'Swecha Academy',
        }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => [],
    };
  };
}

