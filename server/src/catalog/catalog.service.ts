import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '../generated/prisma/enums';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';

const productInclude = {
  category: true,
  images: { orderBy: { position: 'asc' as const } },
  variants: { where: { active: true }, orderBy: { price: 'asc' as const } },
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async categories() {
    const rows = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: { where: { status: ProductStatus.ACTIVE } } },
        },
      },
    });
    return rows.map(({ _count, ...category }) => ({
      ...category,
      productCount: _count.products,
    }));
  }

  async products(query: CatalogQueryDto) {
    const variantFilter: Prisma.ProductVariantWhereInput = {
      active: true,
      price: { gte: query.minPrice, lte: query.maxPrice },
      ...(query.inStock ? { stock: { gt: 0 } } : {}),
    };
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      category: {
        active: true,
        ...(query.category ? { slug: query.category } : {}),
      },
      variants: { some: variantFilter },
      ...(query.featured === true ? { featured: true } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              {
                variants: {
                  some: {
                    sku: { contains: query.search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'newest'
        ? { createdAt: 'desc' }
        : query.sort === 'name-asc'
          ? { name: 'asc' }
          : { featured: 'desc' };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    const data = rows
      .map(toCatalogProduct)
      .sort((a, b) =>
        query.sort === 'price-asc'
          ? a.price - b.price
          : query.sort === 'price-desc'
            ? b.price - a.price
            : 0,
      );
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async product(id: string) {
    const row = await this.prisma.product.findFirst({
      where: { id, status: ProductStatus.ACTIVE, category: { active: true } },
      include: productInclude,
    });
    if (!row) throw new NotFoundException('Product not found.');
    return toCatalogProduct(row);
  }
}

type CatalogRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
function toCatalogProduct(row: CatalogRow) {
  const variant = row.variants[0];
  const stock = row.variants.reduce(
    (sum, item) => sum + Math.max(0, item.stock - item.reservedStock),
    0,
  );
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: {
      id: row.category.id,
      name: row.category.name,
      slug: row.category.slug,
    },
    featured: row.featured,
    image: row.images[0]?.url ?? '',
    images: row.images,
    price: variant ? Number(variant.price) : 0,
    stock,
    sku: variant?.sku ?? '',
    variants: row.variants.map((item) => ({
      ...item,
      price: Number(item.price),
      compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
      availableStock: Math.max(0, item.stock - item.reservedStock),
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
