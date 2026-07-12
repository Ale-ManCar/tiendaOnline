import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { AccountStatus, ProductStatus, UserRole } from '../src/generated/prisma/enums';
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
  const catalog=[
    {category:'Technology',categorySlug:'technology',name:'Pulse Pro Headphones',slug:'pulse-pro-headphones',description:'Wireless noise-cancelling headphones with immersive sound and up to 30 hours of battery life.',sku:'NOVA-TECH-001',price:89.99,stock:18,featured:true,image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'},
    {category:'Accessories',categorySlug:'accessories',name:'Urban Steel Watch',slug:'urban-steel-watch',description:'Minimal stainless-steel watch designed for everyday use.',sku:'NOVA-ACC-001',price:64.5,stock:11,featured:true,image:'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80'},
    {category:'Home',categorySlug:'home',name:'Aura Lamp',slug:'aura-lamp',description:'Dimmable warm-light lamp with a contemporary silhouette.',sku:'NOVA-HOME-001',price:39.5,stock:20,featured:true,image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80'},
    {category:'Wellness',categorySlug:'wellness',name:'Balance Yoga Kit',slug:'balance-yoga-kit',description:'Yoga set with non-slip mat, support block, and stretching strap.',sku:'NOVA-WELL-001',price:58.9,stock:16,featured:true,image:'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=900&q=80'},
  ];
  for(const item of catalog){
    const category=await prisma.category.upsert({where:{slug:item.categorySlug},update:{active:true},create:{name:item.category,slug:item.categorySlug,active:true}});
    await prisma.product.upsert({where:{slug:item.slug},update:{status:ProductStatus.ACTIVE},create:{categoryId:category.id,name:item.name,slug:item.slug,description:item.description,status:ProductStatus.ACTIVE,featured:item.featured,images:{create:{url:item.image,altText:item.name}},variants:{create:{sku:item.sku,name:'Default',price:item.price,stock:item.stock,active:true}}}});
  }
}
seed().finally(() => prisma.$disconnect());
