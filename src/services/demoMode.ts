import type { User } from '../types';
import { hashPassword, KEYS, readStorage, uid, writeStorage } from '../utils/storage';

type DemoUser = User & { passwordHash: string };

const DEMO_USERS_KEY = 'nova_demo_users';
const now = () => new Date().toISOString();
const builtInUsers = [
  {
    id: 'demo-admin',
    name: 'Demo Administrator',
    email: 'admin@tienda.com',
    role: 'admin' as const,
    password: 'Administrador123*',
  },
  {
    id: 'demo-customer',
    name: 'Cliente Demo',
    email: 'cliente@tienda.com',
    role: 'customer' as const,
    password: 'Cliente123*',
  },
];

export function isApiUnavailable(error: unknown) {
  return error instanceof TypeError || (error instanceof Error && /database|fetch|network|api/i.test(error.message));
}

export function registerDemoUser(name: string, email: string, password: string) {
  const users = readDemoUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }
  const role: User['role'] = normalizedEmail === 'admin@tienda.com' ? 'admin' : 'customer';
  const user: DemoUser = {
    id: uid('demo-user'),
    name: name.trim(),
    email: normalizedEmail,
    role,
    active: true,
    createdAt: now(),
    passwordHash: hashPassword(normalizeDemoPassword(password)),
  };
  writeDemoUsers([user, ...users]);
  writeStorage(KEYS.session, publicUser(user));
  return publicUser(user);
}

export function loginDemoUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = readDemoUsers().find((candidate) => candidate.email === normalizedEmail);
  if (!user || user.passwordHash !== hashPassword(normalizeDemoPassword(password))) {
    throw new Error('Invalid email or password.');
  }
  if (!user.active) throw new Error('This account is not active.');
  writeStorage(KEYS.session, publicUser(user));
  return publicUser(user);
}

export function restoreDemoSession() {
  return readStorage<User | null>(KEYS.session, null);
}

export function logoutDemoUser() {
  localStorage.removeItem(KEYS.session);
}

function readDemoUsers(): DemoUser[] {
  const users = readStorage<DemoUser[]>(DEMO_USERS_KEY, []);
  const missingUsers = builtInUsers
    .filter((builtInUser) => !users.some((user) => user.email === builtInUser.email))
    .map<DemoUser>((builtInUser) => ({
      id: builtInUser.id,
      name: builtInUser.name,
      email: builtInUser.email,
      role: builtInUser.role,
      active: true,
      createdAt: now(),
      passwordHash: hashPassword(normalizeDemoPassword(builtInUser.password)),
    }));
  return [...missingUsers, ...users];
}

function writeDemoUsers(users: DemoUser[]) {
  writeStorage(DEMO_USERS_KEY, users);
}

function publicUser(user: DemoUser): User {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function normalizeDemoPassword(password: string) {
  return password.trim();
}

