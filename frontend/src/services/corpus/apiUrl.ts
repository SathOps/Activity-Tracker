const configuredCorpusApiBase = (
  import.meta.env.VITE_SWECHA_API_BASE_URL ||
  import.meta.env.SWECHA_API_BASE_URL ||
  'https://api.corpus.swecha.org'
).trim();

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getCorpusApiBaseUrl(): string {
  return trimTrailingSlash(configuredCorpusApiBase);
}

export function buildCorpusApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getCorpusApiBaseUrl();

  return `${baseUrl}${normalizedPath}`;
}
