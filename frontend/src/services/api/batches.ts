import {
  getJson,
  postJson,
  deleteJson,
  patchJson,
  getApiBaseUrl,
} from './client';
import type { BatchRecord } from '../../types';

export async function getBatches(): Promise<BatchRecord[]> {
  const payload = await getJson<{ batches: BatchRecord[] }>('/batches/');
  return payload.batches;
}

export async function createBatch(
  name: string,
  start_date?: string,
  end_date?: string
): Promise<BatchRecord> {
  return postJson('/batches/', { name, start_date, end_date });
}

export async function deleteBatch(batchId: number): Promise<void> {
  return deleteJson(`/batches/${batchId}`);
}

export async function updateBatch(
  batchId: number,
  updates: { name?: string; start_date?: string; end_date?: string }
): Promise<BatchRecord> {
  return patchJson(`/batches/${batchId}`, updates);
}

export async function resolveProjects(
  projectPaths: string[]
): Promise<{ resolved: number[]; failed: string[] }> {
  return postJson('/batches/resolve-projects', {
    project_paths: projectPaths,
  });
}

function buildStreamParams(
  usernames: string[],
  projectIds?: number[],
  since?: string,
  until?: string,
  mode?: 'combined' | 'profile' | 'commits'
): string {
  const params = new URLSearchParams();
  params.set('usernames', usernames.join(','));
  if (projectIds?.length) params.set('project_ids', projectIds.join(','));
  if (since) params.set('since', since);
  if (until) params.set('until', until);
  if (mode) params.set('mode', mode);
  return params.toString();
}

export function buildBatchStreamUrl(
  usernames: string[],
  projectIds?: number[],
  since?: string,
  until?: string,
  mode?: 'combined' | 'profile' | 'commits'
): string {
  return `${getApiBaseUrl()}/batches/stream?${buildStreamParams(usernames, projectIds, since, until, mode)}`;
}

export function getCorpusRuntimeBaseUrl(): string {
  return getApiBaseUrl();
}
