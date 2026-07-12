import type { UserRole } from '../generated/prisma/enums';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
export interface TokenPayload {
  sub: string;
  sessionId?: string;
  type: 'access' | 'refresh';
}
export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}
