import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { AccountStatus, UserRole } from '../src/generated/prisma/enums';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!connectionString || !email || !password) throw new Error('DATABASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD are required to seed the administrator.');
const seedConfig = { connectionString, email, password };

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: seedConfig.connectionString }) });
async function seed() {
  const passwordHash = await argon2.hash(seedConfig.password, { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: seedConfig.email },
    update: { role: UserRole.ADMIN, status: AccountStatus.ACTIVE },
    create: { name: 'Nova Store Administrator', email: seedConfig.email, passwordHash, role: UserRole.ADMIN, status: AccountStatus.ACTIVE, emailVerifiedAt: new Date() },
  });
}
seed().finally(() => prisma.$disconnect());
