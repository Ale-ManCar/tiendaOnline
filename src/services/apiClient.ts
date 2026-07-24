const DEFAULT_API_URL = import.meta.env.PROD
  ? 'https://nova-store-api.onrender.com/api/v1'
  : 'http://localhost:3000/api/v1';

const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 75000;

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('El servicio está tardando en responder. Intenta nuevamente en unos segundos.', 408);
    }
    throw new ApiError('No pudimos conectar con el servicio. Revisa que la API esté activa e intenta nuevamente.', 0);
  } finally {
    window.clearTimeout(timeout);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
    if (response.status === 429) throw new ApiError('Demasiados intentos. Espera un momento e intenta nuevamente.', response.status);
    if (response.status === 503) throw new ApiError(message ?? 'El servicio no está disponible. Revisa la configuración de la API.', response.status);
    throw new ApiError(message ?? 'El servidor no pudo procesar la solicitud.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
