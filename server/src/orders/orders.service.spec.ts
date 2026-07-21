import { BadRequestException, ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentMethod, ProductStatus, UserRole } from '../generated/prisma/enums';
import type { PrismaService } from '../database/prisma.service';
import { calculateOrderTotals, mergeDuplicateItems, OrdersService } from './orders.service';

jest.mock('../database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

const prisma = {
  productVariant: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  order: {
    create: jest.fn(),
  },
  cart: {
    findUnique: jest.fn(),
  },
  cartItem: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((callback: unknown) =>
    typeof callback === 'function' ? callback(prisma) : callback,
  ),
};
const config = {
  get: jest.fn((key: string, fallback: unknown) => fallback),
};
const mail = {
  send: jest.fn().mockResolvedValue(undefined),
};

describe('OrdersService', () => {
  const service = new OrdersService(prisma as unknown as PrismaService, config as unknown as ConfigService, mail as never);
  const user = {
    id: '4e68d82e-91a1-406e-b9a5-7b8f1f81b27a',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: UserRole.CUSTOMER,
  } as const;
  const dto = {
    customerEmail: 'jane@example.com',
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    shipping: {
      recipientName: 'Jane Doe',
      phone: '0999999999',
      province: 'Pichincha',
      city: 'Quito',
      line1: 'Main street 123',
    },
    items: [{ variantId: '11111111-1111-4111-8111-111111111111', quantity: 2 }],
  };

  beforeEach(() => jest.clearAllMocks());

  it('calculates totals on the server', () => {
    expect(
      calculateOrderTotals([
        { unitPrice: 10, quantity: 2 },
        { unitPrice: 4.5, quantity: 1 },
      ]),
    ).toEqual({
      subtotal: 24.5,
      tax: 3.67,
      shippingTotal: 5,
      discountTotal: 0,
      total: 33.17,
    });
  });

  it('merges duplicate cart lines before validating stock', () => {
    expect(
      mergeDuplicateItems([
        { variantId: 'a', quantity: 1 },
        { variantId: 'a', quantity: 3 },
        { variantId: 'b', quantity: 2 },
      ]),
    ).toEqual([
      { variantId: 'a', quantity: 4 },
      { variantId: 'b', quantity: 2 },
    ]);
  });

  it('creates an order and decrements stock in a transaction', async () => {
    prisma.productVariant.findMany.mockResolvedValue([
      {
        id: dto.items[0].variantId,
        productId: '22222222-2222-4222-8222-222222222222',
        sku: 'SKU-1',
        price: 12.5,
        stock: 5,
        reservedStock: 1,
        product: { name: 'Pulse Pro', status: ProductStatus.ACTIVE },
      },
    ]);
    prisma.productVariant.updateMany.mockResolvedValue({ count: 1 });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });
    prisma.order.create.mockResolvedValue({
      id: 'order-1',
      code: 'NV-TEST',
      status: OrderStatus.PENDING_PAYMENT,
      total: 33.75,
      items: [
        {
          name: 'Pulse Pro',
          quantity: 2,
          unitPrice: 12.5,
          total: 25,
        },
      ],
    });

    await expect(service.create(user, dto)).resolves.toMatchObject({
      id: 'order-1',
    });
    expect(prisma.productVariant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { stock: { decrement: 2 } },
      }),
    );
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 25,
          tax: 3.75,
          shippingTotal: 5,
          total: 33.75,
        }),
      }),
    );
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 'cart-1' },
    });
    expect(mail.send).toHaveBeenCalledTimes(2);
  });

  it('rejects unavailable products', async () => {
    prisma.productVariant.findMany.mockResolvedValue([]);
    await expect(service.create(user, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects insufficient stock', async () => {
    prisma.productVariant.findMany.mockResolvedValue([
      {
        id: dto.items[0].variantId,
        productId: '22222222-2222-4222-8222-222222222222',
        sku: 'SKU-1',
        price: 12.5,
        stock: 2,
        reservedStock: 1,
        product: { name: 'Pulse Pro', status: ProductStatus.ACTIVE },
      },
    ]);
    await expect(service.create(user, dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
