import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { AccountStatus, UserRole } from '../generated/prisma/enums';
import type { PrismaService } from '../database/prisma.service';

jest.mock('../database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

const prisma = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  refreshSession: {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
  },
  auditEvent: { create: jest.fn() },
};

describe('AuthService security rules', () => {
  const service = new AuthService(
    prisma as unknown as PrismaService,
    { signAsync: jest.fn(), verifyAsync: jest.fn() } as unknown as JwtService,
    {
      get: jest.fn().mockReturnValue('a-secure-test-secret-with-32-characters'),
    } as unknown as ConfigService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects duplicate registration emails', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.register(
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'StrongPass1!',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns the same generic error for unknown credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login(
        { email: 'missing@example.com', password: 'WrongPass1!' },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a suspended account even with the correct password', async () => {
    const passwordHash = await argon2.hash('StrongPass1!');
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      passwordHash,
      role: UserRole.CUSTOMER,
      status: AccountStatus.SUSPENDED,
    });
    await expect(
      service.login(
        { email: 'jane@example.com', password: 'StrongPass1!' },
        {},
      ),
    ).rejects.toThrow('This account is not active.');
  });
});
