import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '../generated/prisma/enums';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { UpsertCategoryDto } from './dto/upsert-category.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';

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

  async createCategory(dto: UpsertCategoryDto) {
    const name = dto.name.trim();
    const slug = slugify(name);
    try {
      return await this.prisma.category.create({
        data: { name, slug, description: dto.description?.trim(), active: dto.active },
      });
    } catch (error) {
      this.handleUniqueConflict(error, 'A category with this name already exists.');
      throw error;
    }
  }

  async updateCategory(id: string, dto: UpsertCategoryDto) {
    const name = dto.name.trim();
    const slug = slugify(name);
    try {
      return await this.prisma.category.update({
        where: { id },
        data: { name, slug, description: dto.description?.trim(), active: dto.active },
      });
    } catch (error) {
      this.handleUniqueConflict(error, 'A category with this name already exists.');
      throw error;
    }
  }

  async deleteCategory(id: string) {
    const productCount = await this.prisma.product.count({ where: { categoryId: id, status: { not: ProductStatus.ARCHIVED } } });
    if (productCount > 0) throw new BadRequestException('This category still has products assigned.');
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  async createProduct(dto: UpsertProductDto) {
    const category = await this.resolveCategory(dto);
    const slug = await this.uniqueProductSlug(dto.name);
    try {
      return toCatalogProduct(
        await this.prisma.product.create({
          data: {
            categoryId: category.id,
            name: dto.name.trim(),
            slug,
            description: dto.description.trim(),
            status: dto.active ? ProductStatus.ACTIVE : ProductStatus.DRAFT,
            featured: dto.featured,
            images: { create: { url: dto.image.trim(), altText: dto.name.trim() } },
            variants: { create: { sku: dto.sku.trim(), name: 'Default', price: dto.price, stock: Math.floor(dto.stock), active: true } },
          },
          include: productInclude,
        }),
      );
    } catch (error) {
      this.handleUniqueConflict(error, 'A product with this SKU already exists.');
      throw error;
    }
  }

  async updateProduct(id: string, dto: UpsertProductDto) {
    const category = await this.resolveCategory(dto);
    const existing = await this.prisma.product.findUnique({ where: { id }, include: { variants: true, images: true } });
    if (!existing) throw new NotFoundException('Product not found.');
    const variant = existing.variants[0];
    const image = existing.images[0];
    try {
      return toCatalogProduct(
        await this.prisma.product.update({
          where: { id },
          data: {
            categoryId: category.id,
            name: dto.name.trim(),
            description: dto.description.trim(),
            status: dto.active ? ProductStatus.ACTIVE : ProductStatus.DRAFT,
            featured: dto.featured,
            images: image
              ? { update: { where: { id: image.id }, data: { url: dto.image.trim(), altText: dto.name.trim() } } }
              : { create: { url: dto.image.trim(), altText: dto.name.trim() } },
            variants: variant
              ? { update: { where: { id: variant.id }, data: { sku: dto.sku.trim(), price: dto.price, stock: Math.floor(dto.stock), active: true } } }
              : { create: { sku: dto.sku.trim(), name: 'Default', price: dto.price, stock: Math.floor(dto.stock), active: true } },
          },
          include: productInclude,
        }),
      );
    } catch (error) {
      this.handleUniqueConflict(error, 'A product with this SKU already exists.');
      throw error;
    }
  }

  async archiveProduct(id: string) {
    await this.prisma.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED } });
    return { ok: true };
  }

  private async resolveCategory(dto: UpsertProductDto) {
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (category) return category;
    }
    const name = dto.category.trim();
    const slug = slugify(name);
    return this.prisma.category.upsert({
      where: { slug },
      update: { name, active: true },
      create: { name, slug, active: true },
    });
  }

  private async uniqueProductSlug(name: string) {
    const base = slugify(name);
    let slug = base;
    let index = 2;
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${base}-${index}`;
      index += 1;
    }
    return slug;
  }

  private handleUniqueConflict(error: unknown, message: string) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002') {
      throw new ConflictException(message);
    }
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

function slugify(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
