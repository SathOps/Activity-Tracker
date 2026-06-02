import { postJson } from './client';
import type { WeeklyActivity } from '../../types';

export async function getWeeklyPerformance(params: {
  start_date: string;
  end_date: string;
  include_commits?: boolean;
}): Promise<WeeklyActivity> {
  return postJson('/weekly-performance/single', params);
}

export async function getWeeklyPerformanceBatch(params: {
  start_date: string;
  end_date: string;
  interns: Array<{ gitlab_username: string }>;
  include_commits?: boolean;
}): Promise<WeeklyActivity[]> {
  return postJson('/weekly-performance/batch', params);
}
