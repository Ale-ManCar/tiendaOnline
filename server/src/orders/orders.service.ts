import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
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

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const totals = calculateOrderTotals(pricedItems);
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

      return tx.order.create({
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
        include: { items: true, payments: true, statusHistory: true },
      });
    });
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
  const shippingTotal = 0;
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

function createOrderCode() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NV-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}
