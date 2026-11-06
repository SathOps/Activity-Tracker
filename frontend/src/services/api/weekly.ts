import { postJson } from './client';
import type { WeeklyActivity } from '../../types';
import { getMockWeeklyPerformance } from '../mockData';

export async function getWeeklyPerformance(params: {
  start_date: string;
  end_date: string;
  include_commits?: boolean;
}): Promise<WeeklyActivity> {
  try {
    return await postJson('/weekly-performance/single', params);
  } catch {
    return getMockWeeklyPerformance(params);
  }
}

export async function getWeeklyPerformanceBatch(params: {
  start_date: string;
  end_date: string;
  interns: Array<{ gitlab_username: string }>;
  include_commits?: boolean;
}): Promise<WeeklyActivity[]> {
  try {
    return await postJson('/weekly-performance/batch', params);
  } catch {
    return params.interns.map((i) =>
      getMockWeeklyPerformance({ ...params, username: i.gitlab_username })
    );
  }
}
