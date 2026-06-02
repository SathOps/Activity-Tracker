import { getJson } from './client';
import type { SelectorTreeResponse } from '../../types';

export async function getSelectorTree(): Promise<SelectorTreeResponse> {
  return getJson<SelectorTreeResponse>('/selector');
}
