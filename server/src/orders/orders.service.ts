import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ProductStatus,
} from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateOrderDto } from './dto/create-order.dto';

const TAX_RATE = 0.15;
const orderInclude = { items: true, payments: true, statusHistory: true };

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  findForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(idOrCode: string, status: OrderStatus) {
    const order = await this.prisma.order.findFirst({
      where: this.orderIdentityWhere(idOrCode),
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Order not found.');

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status,
        statusHistory: { create: { status } },
      },
      include: orderInclude,
    });
  }

  async create(user: AuthenticatedUser, dto: CreateOrderDto) {
    const requestedItems = mergeDuplicateItems(dto.items);
    const variantIds = requestedItems.map((item) => item.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        active: true,
        product: { status: ProductStatus.ACTIVE, category: { active: true } },
      },
      include: { product: true },
    });
    if (variants.length !== variantIds.length)
      throw new BadRequestException('One or more products are unavailable.');

    const pricedItems = requestedItems.map((item) => {
      const variant = variants.find((row) => row.id === item.variantId);
      if (!variant) throw new BadRequestException('Product is unavailable.');
      const availableStock = variant.stock - variant.reservedStock;
      if (availableStock < item.quantity)
        throw new ConflictException(
          `${variant.product.name} has only ${Math.max(0, availableStock)} units available.`,
        );
      return {
        productId: variant.productId,
        variantId: variant.id,
        sku: variant.sku,
        name: variant.product.name,
        unitPrice: Number(variant.price),
        quantity: item.quantity,
      };
    });
    const totals = this.calculateOrderTotals(pricedItems);
    const code = createOrderCode();

    const shippingAddress = {
      recipientName: dto.shipping.recipientName,
      phone: dto.shipping.phone,
      province: dto.shipping.province,
      city: dto.shipping.city,
      line1: dto.shipping.line1,
      reference: dto.shipping.reference,
    };

    return this.prisma.$transaction(async (tx) => {
      for (const item of pricedItems) {
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variantId, active: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1)
          throw new ConflictException('Stock changed while creating the order.');
      }

      const order = await tx.order.create({
        data: {
          code,
          userId: user.id,
          customerName: dto.shipping.recipientName,
          customerEmail: dto.customerEmail,
          status: OrderStatus.PENDING_PAYMENT,
          subtotal: totals.subtotal,
          tax: totals.tax,
          shippingTotal: totals.shippingTotal,
          discountTotal: totals.discountTotal,
          total: totals.total,
          shippingAddress,
          notes: dto.notes,
          items: {
            create: pricedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              sku: item.sku,
              name: item.name,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              total: roundMoney(item.unitPrice * item.quantity),
            })),
          },
          statusHistory: {
            create: { status: OrderStatus.PENDING_PAYMENT },
          },
          payments:
            dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
              ? undefined
              : {
                  create: {
                    provider: 'manual',
                    method: dto.paymentMethod,
                    status: PaymentStatus.PENDING,
                    amount: totals.total,
                    currency: 'USD',
                    idempotencyKey: `${code}-${dto.paymentMethod}`,
                  },
                },
        },
        include: orderInclude,
      });

      const userCart = await tx.cart.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (userCart) await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });

      return order;
    });
  }

  private calculateOrderTotals(items: Pick<PricedItem, 'unitPrice' | 'quantity'>[]) {
    const subtotal = roundMoney(
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
    const tax = roundMoney(subtotal * TAX_RATE);
    const shippingTotal = calculateShippingTotal(
      subtotal,
      numberConfig(this.config, 'SHIPPING_FLAT_RATE', 5),
      numberConfig(this.config, 'FREE_SHIPPING_THRESHOLD', 100),
    );
    const discountTotal = 0;
    return {
      subtotal,
      tax,
      shippingTotal,
      discountTotal,
      total: roundMoney(subtotal + tax + shippingTotal - discountTotal),
    };
  }

  private orderIdentityWhere(idOrCode: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrCode,
      );
    return isUuid ? { OR: [{ id: idOrCode }, { code: idOrCode }] } : { code: idOrCode };
  }
}

type RequestedItem = { variantId: string; quantity: number };
type PricedItem = {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export function mergeDuplicateItems(items: RequestedItem[]) {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
  }
  return [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));
}

export function calculateOrderTotals(items: Pick<PricedItem, 'unitPrice' | 'quantity'>[]) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );
  const tax = roundMoney(subtotal * TAX_RATE);
  const shippingTotal = calculateShippingTotal(subtotal, 5, 100);
  const discountTotal = 0;
  return {
    subtotal,
    tax,
    shippingTotal,
    discountTotal,
    total: roundMoney(subtotal + tax + shippingTotal - discountTotal),
  };
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function calculateShippingTotal(subtotal: number, flatRate: number, freeThreshold: number) {
  if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
  return roundMoney(Math.max(0, flatRate));
}

function numberConfig(config: ConfigService, key: string, fallback: number) {
  const candidate = Number(config.get<string | number>(key, fallback));
  return Number.isFinite(candidate) ? candidate : fallback;
}

function createOrderCode() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NV-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}
