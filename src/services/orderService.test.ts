import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateOrder, createServerOrder } from './orderService';
import type { Product, User } from '../types';

const response = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('order totals', () => {
  it('calculates VAT, flat shipping, and total below free-shipping threshold', () => {
    expect(calculateOrder([{ price: 10, quantity: 2 }, { price: 5, quantity: 1 }])).toEqual({
      subtotal: 25,
      tax: 3.75,
      shippingCost: 5,
      total: 33.75,
    });
  });

  it('applies free shipping when subtotal reaches the threshold', () => {
    expect(calculateOrder([{ price: 50, quantity: 2 }])).toEqual({
      subtotal: 100,
      tax: 15,
      shippingCost: 0,
      total: 115,
    });
  });
});

describe('order API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('submits variant IDs and maps the created order', async () => {
    const user: User = {
      id: 'u1',
      name: 'Jane',
      email: 'jane@example.com',
      role: 'customer',
      active: true,
      createdAt: '2026-01-01',
    };
    const products: Product[] = [
      {
        id: 'p1',
        name: 'Lamp',
        description: 'Warm lamp',
        category: 'Home',
        defaultVariantId: 'v1',
        price: 10,
        stock: 4,
        image: 'https://example.com/lamp.jpg',
        featured: false,
        sku: 'LAMP-1',
        active: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        id: 'o1',
        code: 'NV-1',
        userId: 'u1',
        customerName: 'Jane',
        customerEmail: 'jane@example.com',
        createdAt: '2026-01-02',
        items: [{ productId: 'p1', name: 'Lamp', unitPrice: '10', quantity: 2 }],
        subtotal: '20',
        tax: '3',
        shippingCost: '5',
        total: '28',
        shippingAddress: { recipientName: 'Jane', phone: '0999999999', province: 'Guayas', city: 'Guayaquil', line1: 'Main street' },
        status: 'PENDING_PAYMENT',
        statusHistory: [{ status: 'PENDING_PAYMENT', createdAt: '2026-01-02' }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const order = await createServerOrder(
      user,
      [{ productId: 'p1', quantity: 2 }],
      products,
      { fullName: 'Jane', email: 'jane@example.com', phone: '0999999999', province: 'Guayas', city: 'Guayaquil', address: 'Main street' },
      'Tarjeta',
    );

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/orders'), expect.objectContaining({ method: 'POST', credentials: 'include' }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ items: [{ variantId: 'v1', quantity: 2 }], paymentMethod: 'CARD' });
    expect(order).toMatchObject({
      id: 'NV-1',
      total: 28,
      shippingCost: 5,
      status: 'Pendiente',
      items: [{ productId: 'p1', image: 'https://example.com/lamp.jpg' }],
    });
  });

  it('rejects products without checkout variants before calling the API', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user: User = { id: 'u1', name: 'Jane', email: 'jane@example.com', role: 'customer', active: true, createdAt: '2026-01-01' };

    await expect(
      createServerOrder(
        user,
        [{ productId: 'p1', quantity: 1 }],
        [
          {
            id: 'p1',
            name: 'Lamp',
            description: 'Warm lamp',
            category: 'Home',
            price: 10,
            stock: 4,
            image: '',
            featured: false,
            sku: 'LAMP-1',
            active: true,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ],
        { fullName: 'Jane', email: 'jane@example.com', phone: '0999999999', province: 'Guayas', city: 'Guayaquil', address: 'Main street' },
        'Tarjeta',
      ),
    ).rejects.toThrow('not available for checkout');
    expect(fetch).not.toHaveBeenCalled();
  });
});
