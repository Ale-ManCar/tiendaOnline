import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { AccountStatus, ProductStatus, UserRole } from '../src/generated/prisma/enums';
import { PrismaClient, type Prisma } from '../src/generated/prisma/client';

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
    {category:'Technology',categorySlug:'technology',name:'Mini Sound Speaker',slug:'mini-sound-speaker',description:'Compact Bluetooth speaker with powerful sound for a desk, living room, or travel bag.',sku:'NOVA-TECH-002',price:42.99,stock:24,featured:true,image:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80'},
    {category:'Technology',categorySlug:'technology',name:'Flow Wireless Keyboard',slug:'flow-wireless-keyboard',description:'Slim, quiet wireless keyboard for focused work and study.',sku:'NOVA-TECH-003',price:54.9,stock:14,featured:true,image:'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80'},
    {category:'Technology',categorySlug:'technology',name:'ChargeGo Power Bank',slug:'chargego-power-bank',description:'Fast-charging portable battery that keeps your devices active throughout the day.',sku:'NOVA-TECH-004',price:34.99,stock:32,featured:true,image:'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80'},
    {category:'Technology',categorySlug:'technology',name:'Swift Wireless Mouse',slug:'swift-wireless-mouse',description:'Ergonomic wireless mouse with quiet clicks and daily-work precision.',sku:'NOVA-TECH-005',price:28.99,stock:27,featured:false,image:'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80'},
    {category:'Accessories',categorySlug:'accessories',name:'Urban Steel Watch',slug:'urban-steel-watch',description:'Minimal stainless-steel watch designed for everyday use.',sku:'NOVA-ACC-001',price:64.5,stock:11,featured:true,image:'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80'},
    {category:'Accessories',categorySlug:'accessories',name:'City Carry Backpack',slug:'city-carry-backpack',description:'Water-resistant urban backpack with a padded laptop compartment.',sku:'NOVA-ACC-002',price:49.99,stock:17,featured:true,image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80'},
    {category:'Accessories',categorySlug:'accessories',name:'Slim Card Wallet',slug:'slim-card-wallet',description:'Compact wallet for cards and cash with an elegant finish.',sku:'NOVA-ACC-003',price:24.5,stock:28,featured:false,image:'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80'},
    {category:'Accessories',categorySlug:'accessories',name:'Solace Sunglasses',slug:'solace-sunglasses',description:'Lightweight sunglasses with UV protection and a modern silhouette.',sku:'NOVA-ACC-004',price:36,stock:19,featured:false,image:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80'},
    {category:'Home',categorySlug:'home',name:'Aura Lamp',slug:'aura-lamp',description:'Dimmable warm-light lamp with a contemporary silhouette.',sku:'NOVA-HOME-001',price:39.5,stock:20,featured:true,image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80'},
    {category:'Home',categorySlug:'home',name:'Soft Home Throw',slug:'soft-home-throw',description:'Soft decorative throw blanket for living rooms or bedrooms.',sku:'NOVA-HOME-002',price:31.75,stock:22,featured:false,image:'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80'},
    {category:'Home',categorySlug:'home',name:'Calm Scent Candle',slug:'calm-scent-candle',description:'Warm aromatic candle for relaxed interior spaces.',sku:'NOVA-HOME-003',price:18.9,stock:36,featured:false,image:'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=900&q=80'},
    {category:'Home',categorySlug:'home',name:'Ceramic Plant Pot',slug:'ceramic-plant-pot',description:'Clean ceramic planter for indoor plants and decorative corners.',sku:'NOVA-HOME-004',price:22.99,stock:26,featured:false,image:'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80'},
    {category:'Wellness',categorySlug:'wellness',name:'Balance Yoga Kit',slug:'balance-yoga-kit',description:'Yoga set with non-slip mat, support block, and stretching strap.',sku:'NOVA-WELL-001',price:58.9,stock:16,featured:true,image:'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=900&q=80'},
    {category:'Wellness',categorySlug:'wellness',name:'Hydra Steel Bottle',slug:'hydra-steel-bottle',description:'Stainless-steel thermal bottle for hot or cold drinks.',sku:'NOVA-WELL-002',price:27.5,stock:30,featured:true,image:'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80'},
    {category:'Wellness',categorySlug:'wellness',name:'Relief Massage Roller',slug:'relief-massage-roller',description:'Massage roller for muscle recovery after workouts.',sku:'NOVA-WELL-003',price:29.9,stock:21,featured:false,image:'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?auto=format&fit=crop&w=900&q=80'},
    {category:'Fashion',categorySlug:'fashion',name:'Everyday Cotton Hoodie',slug:'everyday-cotton-hoodie',description:'Soft cotton hoodie with a relaxed everyday fit.',sku:'NOVA-FASH-001',price:46.99,stock:18,featured:true,image:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80'},
    {category:'Fashion',categorySlug:'fashion',name:'Nova Street Sneakers',slug:'nova-street-sneakers',description:'Versatile casual sneakers designed for comfortable walking.',sku:'NOVA-FASH-002',price:74.9,stock:15,featured:true,image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'},
    {category:'Fashion',categorySlug:'fashion',name:'Canvas Market Tote',slug:'canvas-market-tote',description:'Canvas tote bag for shopping, university, or casual days out.',sku:'NOVA-FASH-003',price:21.5,stock:33,featured:false,image:'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80'},
    {category:'Beauty',categorySlug:'beauty',name:'Glow Skincare Set',slug:'glow-skincare-set',description:'Essential skincare set with cleanser, moisturizer, and serum.',sku:'NOVA-BEAU-001',price:52.9,stock:20,featured:true,image:'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80'},
    {category:'Beauty',categorySlug:'beauty',name:'Luna Eau de Parfum',slug:'luna-eau-de-parfum',description:'Fresh floral fragrance with an elegant finish.',sku:'NOVA-BEAU-002',price:69.99,stock:13,featured:false,image:'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80'},
    {category:'Kitchen',categorySlug:'kitchen',name:'Morning Brew Maker',slug:'morning-brew-maker',description:'Compact coffee maker for fresh coffee at home or in the office.',sku:'NOVA-KIT-001',price:79.5,stock:12,featured:true,image:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80'},
    {category:'Kitchen',categorySlug:'kitchen',name:'Bamboo Prep Board',slug:'bamboo-prep-board',description:'Durable bamboo board for preparing and serving food.',sku:'NOVA-KIT-002',price:25.9,stock:29,featured:false,image:'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80'},
    {category:'Kitchen',categorySlug:'kitchen',name:'Classic French Press',slug:'classic-french-press',description:'Resistant glass French press for rich coffee at home.',sku:'NOVA-KIT-003',price:32.5,stock:20,featured:false,image:'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?auto=format&fit=crop&w=900&q=80'},
    {category:'Office',categorySlug:'office',name:'Focus Desk Organizer',slug:'focus-desk-organizer',description:'Desk organizer for keeping cables, notes, and accessories tidy.',sku:'NOVA-OFF-001',price:19.99,stock:31,featured:false,image:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'},
    {category:'Office',categorySlug:'office',name:'Ideas Hardcover Notebook',slug:'ideas-hardcover-notebook',description:'Hardcover notebook with thick paper for notes, plans, and sketches.',sku:'NOVA-OFF-002',price:14.9,stock:44,featured:false,image:'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80'},
    {category:'Office',categorySlug:'office',name:'Focus LED Desk Lamp',slug:'focus-led-desk-lamp',description:'Adjustable LED desk lamp for studying and work sessions.',sku:'NOVA-OFF-003',price:37.9,stock:18,featured:false,image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80'},
    {category:'Outdoor',categorySlug:'outdoor',name:'Weekend Picnic Blanket',slug:'weekend-picnic-blanket',description:'Foldable waterproof blanket for parks, beaches, and short trips.',sku:'NOVA-OUT-001',price:38.5,stock:16,featured:false,image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'},
    {category:'Outdoor',categorySlug:'outdoor',name:'Trail LED Lantern',slug:'trail-led-lantern',description:'Rechargeable LED lantern for camping, emergencies, and outdoor activities.',sku:'NOVA-OUT-002',price:33.99,stock:23,featured:true,image:'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=900&q=80'},
    {category:'Outdoor',categorySlug:'outdoor',name:'Everyday Travel Mug',slug:'everyday-travel-mug',description:'Thermal travel mug with spill-resistant lid for daily drinks.',sku:'NOVA-OUT-003',price:23.99,stock:35,featured:false,image:'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=900&q=80'},
  ];
  for(const item of catalog){
    const category=await prisma.category.upsert({where:{slug:item.categorySlug},update:{name:item.category,active:true},create:{name:item.category,slug:item.categorySlug,active:true}});
    const product=await prisma.product.upsert({
      where:{slug:item.slug},
      update:{categoryId:category.id,name:item.name,description:item.description,status:ProductStatus.ACTIVE,featured:item.featured},
      create:{categoryId:category.id,name:item.name,slug:item.slug,description:item.description,status:ProductStatus.ACTIVE,featured:item.featured}
    });
    const image=await prisma.productImage.findFirst({where:{productId:product.id,position:0}});
    if(image) await prisma.productImage.update({where:{id:image.id},data:{url:item.image,altText:item.name}});
    else await prisma.productImage.create({data:{productId:product.id,url:item.image,altText:item.name,position:0}});
    await prisma.productVariant.upsert({
      where:{sku:item.sku},
      update:{productId:product.id,name:'Default',price:item.price,stock:item.stock,active:true},
      create:{productId:product.id,sku:item.sku,name:'Default',price:item.price,stock:item.stock,active:true}
    });
  }
  await prisma.storeSetting.upsert({
    where:{id:'default'},
    update:{data:defaultSettings as Prisma.InputJsonObject},
    create:{id:'default',data:defaultSettings as Prisma.InputJsonObject}
  });
}
seed().finally(() => prisma.$disconnect());

const defaultSettings={
  name:'Nova Store',
  legalName:'Nova Store',
  shortName:'NOVA',
  logoLetter:'N',
  announcement:'Envio gratis en compras superiores a $100 · Compra segura',
  tagline:'Productos utiles, diseño contemporaneo y una experiencia de compra simple.',
  supportEmail:'soporte@novastore.com',
  supportPhone:'+593 99 000 0000',
  location:'Guayaquil, Ecuador',
  businessHours:'Lun-Vie, 09:00-18:00',
  footerNote:'Tienda online profesional',
  defaultCheckoutCity:'Guayaquil',
  shippingFlatRate:5,
  freeShippingThreshold:100,
  shippingCoverageNote:'Entrega disponible segun cobertura del negocio.',
  bankAccountLabel:'Cuenta bancaria por definir',
  bankTransferInstructions:'Realiza la transferencia y escribe el numero de comprobante para que el equipo pueda validar tu pedido.',
  cashOnDeliveryInstructions:'Paga al recibir tu pedido. El equipo confirmara disponibilidad y zona de cobertura antes del envio.'
};
