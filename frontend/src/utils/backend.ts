const DEFAULT_BACKEND = 'https://haram-locator.preview.emergentagent.com';

function sanitizeBaseUrl(url?: string | null): string {
  const raw = (url || DEFAULT_BACKEND).trim();
  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  // Normalize accidental /api suffix so callers can safely append /api/... once.
  return withoutTrailingSlash.replace(/\/api$/i, '');
}

export function getBackendBaseUrl(): string {
  return sanitizeBaseUrl(process.env.EXPO_PUBLIC_BACKEND_URL);
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBackendBaseUrl()}/api${normalizedPath}`;
}

export function buildPathUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
}
