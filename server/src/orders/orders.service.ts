import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
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
import { MailService } from '../mail/mail.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateOrderDto } from './dto/create-order.dto';

const TAX_RATE = 0.15;
const orderInclude = { items: true, payments: true, statusHistory: true };

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
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

    const order = await this.prisma.$transaction(async (tx) => {
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

    this.sendOrderEmails(order, dto).catch((error) => {
      this.logger.warn(
        `Order ${order.code} was created, but notification email failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });

    return order;
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

  private async sendOrderEmails(
    order: OrderEmailPayload,
    dto: CreateOrderDto,
  ) {
    const ownerEmail = this.config.get<string>(
      'ORDER_NOTIFICATION_EMAIL',
      this.config.get<string>('ADMIN_EMAIL', 'alemancar0511@gmail.com'),
    );
    const storeName = this.config.get<string>('STORE_NAME', 'Nova Store');
    const supportPhone = this.config.get<string>('STORE_SUPPORT_PHONE', '0968822603');
    const itemsText = order.items
      .map((item) => `- ${item.quantity} x ${item.name}: ${formatCurrency(Number(item.total))}`)
      .join('\n');
    const itemsHtml = order.items
      .map(
        (item) =>
          `<li><strong>${escapeHtml(item.name)}</strong><br>${item.quantity} x ${formatCurrency(Number(item.unitPrice))} = ${formatCurrency(Number(item.total))}</li>`,
      )
      .join('');
    const total = formatCurrency(Number(order.total));
    const customerSubject = `Confirmación de pedido ${order.code}`;
    const adminSubject = `Nuevo pedido ${order.code} - ${total}`;
    const delivery = `${dto.shipping.line1}, ${dto.shipping.city}, ${dto.shipping.province}`;
    const paymentReference = dto.notes ? `\nNotas: ${dto.notes}` : '';

    await Promise.all([
      this.mail.send({
        to: dto.customerEmail,
        subject: customerSubject,
        text: `Hola ${dto.shipping.recipientName}, recibimos tu pedido ${order.code}.\n\nProductos:\n${itemsText}\n\nTotal: ${total}\nPago: ${paymentLabel(dto.paymentMethod)}\nEntrega: ${delivery}\n\nSi necesitas ayuda, escríbenos al ${supportPhone}.\n\n${storeName}`,
        html: orderEmailHtml({
          title: 'Pedido recibido',
          intro: `Hola ${escapeHtml(dto.shipping.recipientName)}, recibimos tu pedido y lo estamos preparando para revisión.`,
          code: order.code,
          itemsHtml,
          total,
          payment: paymentLabel(dto.paymentMethod),
          delivery,
          footer: `Si necesitas ayuda, escríbenos al ${escapeHtml(supportPhone)}.`,
          storeName,
        }),
      }),
      this.mail.send({
        to: ownerEmail,
        subject: adminSubject,
        text: `Nuevo pedido ${order.code}\n\nCliente: ${dto.shipping.recipientName}\nEmail: ${dto.customerEmail}\nTeléfono: ${dto.shipping.phone}\nEntrega: ${delivery}\nPago: ${paymentLabel(dto.paymentMethod)}${paymentReference}\n\nProductos:\n${itemsText}\n\nTotal: ${total}`,
        html: orderEmailHtml({
          title: 'Nuevo pedido',
          intro: `Se registró un nuevo pedido para ${escapeHtml(storeName)}.`,
          code: order.code,
          itemsHtml,
          total,
          payment: paymentLabel(dto.paymentMethod),
          delivery,
          footer: `Cliente: ${escapeHtml(dto.shipping.recipientName)} · ${escapeHtml(dto.customerEmail)} · ${escapeHtml(dto.shipping.phone)}`,
          storeName,
        }),
      }),
    ]);
  }
}

type OrderEmailPayload = {
  code: string;
  total: unknown;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: unknown;
    total: unknown;
  }>;
};

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function paymentLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    [PaymentMethod.BANK_TRANSFER]: 'Transferencia',
    [PaymentMethod.CASH_ON_DELIVERY]: 'Contra entrega',
    [PaymentMethod.CARD]: 'Tarjeta',
  };
  return labels[method] ?? method;
}

function orderEmailHtml({
  title,
  intro,
  code,
  itemsHtml,
  total,
  payment,
  delivery,
  footer,
  storeName,
}: {
  title: string;
  intro: string;
  code: string;
  itemsHtml: string;
  total: string;
  payment: string;
  delivery: string;
  footer: string;
  storeName: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#17181d;background:#f6f4ef;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e6e0d8">
        <div style="background:#17181d;color:#fff;padding:24px">
          <small style="letter-spacing:.18em;text-transform:uppercase;color:#ffb7ad">${escapeHtml(storeName)}</small>
          <h1 style="margin:8px 0 0;font-size:28px">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:26px">
          <p>${intro}</p>
          <p><strong>Pedido:</strong> ${escapeHtml(code)}</p>
          <ul style="padding-left:20px">${itemsHtml}</ul>
          <table style="width:100%;margin-top:18px;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#6b7280">Pago</td><td style="padding:8px 0;text-align:right"><strong>${escapeHtml(payment)}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Entrega</td><td style="padding:8px 0;text-align:right">${escapeHtml(delivery)}</td></tr>
            <tr><td style="padding:12px 0;font-size:18px">Total</td><td style="padding:12px 0;text-align:right;font-size:22px"><strong>${escapeHtml(total)}</strong></td></tr>
          </table>
          <p style="color:#6b7280">${footer}</p>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return replacements[character] ?? character;
  });
}
