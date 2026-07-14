import type { Category, Product, User } from '../types';
import { hashPassword, KEYS, readStorage, uid, writeStorage } from '../utils/storage';

type DemoUser = User & { passwordHash: string };

const DEMO_USERS_KEY = 'nova_demo_users';
const now = () => new Date().toISOString();

const demoCategories: Category[] = [
  { id: 'demo-cat-technology', name: 'Technology', slug: 'technology', active: true, createdAt: now() },
  { id: 'demo-cat-accessories', name: 'Accessories', slug: 'accessories', active: true, createdAt: now() },
  { id: 'demo-cat-home', name: 'Home', slug: 'home', active: true, createdAt: now() },
  { id: 'demo-cat-wellness', name: 'Wellness', slug: 'wellness', active: true, createdAt: now() },
];

const demoProducts: Product[] = [
  {
    id: 'demo-product-headphones',
    defaultVariantId: 'demo-variant-headphones',
    name: 'Pulse Pro Headphones',
    description: 'Wireless noise-cancelling headphones with immersive sound and up to 30 hours of battery life.',
    category: 'Technology',
    categoryId: 'demo-cat-technology',
    price: 89.99,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    featured: true,
    sku: 'NOVA-TECH-001',
    active: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'demo-product-watch',
    defaultVariantId: 'demo-variant-watch',
    name: 'Urban Steel Watch',
    description: 'Minimal stainless-steel watch designed for everyday use.',
    category: 'Accessories',
    categoryId: 'demo-cat-accessories',
    price: 64.5,
    stock: 11,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80',
    featured: true,
    sku: 'NOVA-ACC-001',
    active: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'demo-product-lamp',
    defaultVariantId: 'demo-variant-lamp',
    name: 'Aura Lamp',
    description: 'Dimmable warm-light lamp with a contemporary silhouette.',
    category: 'Home',
    categoryId: 'demo-cat-home',
    price: 39.5,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
    featured: true,
    sku: 'NOVA-HOME-001',
    active: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'demo-product-yoga',
    defaultVariantId: 'demo-variant-yoga',
    name: 'Balance Yoga Kit',
    description: 'Yoga set with non-slip mat, support block, and stretching strap.',
    category: 'Wellness',
    categoryId: 'demo-cat-wellness',
    price: 58.9,
    stock: 16,
    image: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=900&q=80',
    featured: true,
    sku: 'NOVA-WELL-001',
    active: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

export function getDemoCatalog() {
  return { categories: demoCategories, products: demoProducts };
}

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
    passwordHash: hashPassword(password),
  };
  writeDemoUsers([user, ...users]);
  writeStorage(KEYS.session, publicUser(user));
  return publicUser(user);
}

export function loginDemoUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = readDemoUsers().find((candidate) => candidate.email === normalizedEmail);
  if (!user || user.passwordHash !== hashPassword(password)) {
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
  if (users.some((user) => user.email === 'admin@tienda.com')) return users;
  const admin: DemoUser = {
    id: 'demo-admin',
    name: 'Demo Administrator',
    email: 'admin@tienda.com',
    role: 'admin',
    active: true,
    createdAt: now(),
    passwordHash: hashPassword('Administrador123*'),
  };
  return [
    admin,
    ...users,
  ];
}

function writeDemoUsers(users: DemoUser[]) {
  writeStorage(DEMO_USERS_KEY, users);
}

function publicUser(user: DemoUser): User {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
