import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { SyncCartDto } from './dto/sync-cart.dto';

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: { position: 'asc' as const } },
              category: true,
            },
          },
        },
      },
    },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.toResponse(cart);
  }

  async sync(userId: string, dto: SyncCartDto) {
    const merged = new Map<string, number>();
    for (const item of dto.items) merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
    const items = [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: { in: items.map((item) => item.variantId) },
        active: true,
        product: { status: ProductStatus.ACTIVE, category: { active: true } },
      },
      include: { product: true },
    });
    if (variants.length !== items.length) throw new BadRequestException('One or more cart products are unavailable.');

    const cart = await this.getOrCreateCart(userId);
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      ...items.map((item) => {
        const variant = variants.find((row) => row.id === item.variantId);
        const availableStock = Math.max(0, (variant?.stock ?? 0) - (variant?.reservedStock ?? 0));
        return this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: item.variantId,
            quantity: Math.min(item.quantity, availableStock),
          },
        });
      }),
    ]);

    return this.findForUser(userId);
  }

  private getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: cartInclude,
    });
  }

  private toResponse(cart: Awaited<ReturnType<CartService['getOrCreateCart']>>) {
    return {
      items: cart.items
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          productId: item.variant.productId,
          variantId: item.variantId,
          quantity: Math.min(item.quantity, Math.max(0, item.variant.stock - item.variant.reservedStock)),
          product: {
            id: item.variant.product.id,
            name: item.variant.product.name,
            image: item.variant.product.images[0]?.url ?? '',
            category: item.variant.product.category.name,
          },
        })),
    };
  }
}
