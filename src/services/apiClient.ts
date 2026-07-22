const DEFAULT_API_URL = import.meta.env.PROD
  ? 'https://nova-store-api.onrender.com/api/v1'
  : 'http://localhost:3000/api/v1';

const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
    if (response.status === 429) throw new ApiError('Too many attempts. Wait a moment and try again.', response.status);
    if (response.status === 503) throw new ApiError(message ?? 'The database is not available. Check the API configuration.', response.status);
    throw new ApiError(message ?? 'The server could not process the request.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
