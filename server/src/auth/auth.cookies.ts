import type { CookieOptions, Response } from 'express';

export const ACCESS_COOKIE = 'nova_access';
export const REFRESH_COOKIE = 'nova_refresh';
const production = process.env.NODE_ENV === 'production';
const base: CookieOptions = {
  httpOnly: true,
  secure: production,
  sameSite: 'lax',
  path: '/',
};
export function setAuthCookies(
  response: Response,
  access: string,
  refresh: string,
) {
  response.cookie(ACCESS_COOKIE, access, { ...base, maxAge: 15 * 60 * 1000 });
  response.cookie(REFRESH_COOKIE, refresh, {
    ...base,
    path: '/api/v1/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}
export function clearAuthCookies(response: Response) {
  response.clearCookie(ACCESS_COOKIE, base);
  response.clearCookie(REFRESH_COOKIE, { ...base, path: '/api/v1/auth' });
}
