import type { CartItem, Order, OrderItem, PaymentMethod, PaymentStatus, Product, ShippingData, User } from '../types';
import { storeConfig } from '../config/storeConfig';
import { apiRequest } from './apiClient';

export const roundMoney = (value: number) => Number(value.toFixed(2));

export function calculateOrder(items: Pick<OrderItem, 'price' | 'quantity'>[]) {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const tax = roundMoney(subtotal * 0.15);
  const shippingCost = calculateShippingCost(subtotal);

  return { subtotal, tax, shippingCost, total: roundMoney(subtotal + tax + shippingCost) };
}

export function calculateShippingCost(subtotal: number) {
  if (storeConfig.freeShippingThreshold > 0 && subtotal >= storeConfig.freeShippingThreshold) return 0;
  return roundMoney(Math.max(0, storeConfig.shippingFlatRate));
}

type ApiPaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY';
type ApiPaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
type ApiOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PREPARING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'PAYMENT_FAILED';
type ApiShippingAddress = { recipientName: string; phone: string; province: string; city: string; line1: string; reference?: string };
type ApiOrder = {
  id: string;
  code: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  items: { productId: string; name: string; unitPrice: string | number; quantity: number }[];
  subtotal: string | number;
  tax: string | number;
  shippingCost?: string | number;
  shippingTotal?: string | number;
  total: string | number;
  paymentMethod?: ApiPaymentMethod;
  payments?: { method: ApiPaymentMethod; status: ApiPaymentStatus; providerReference?: string | null }[];
  shippingAddress: ApiShippingAddress;
  status: ApiOrderStatus;
  statusHistory: { status: ApiOrderStatus; createdAt: string }[];
  notes?: string;
};

const paymentToApi = (method: PaymentMethod): ApiPaymentMethod => (method === 'Tarjeta' ? 'CARD' : method === 'Transferencia' ? 'BANK_TRANSFER' : 'CASH_ON_DELIVERY');
const paymentFromApi = (method?: ApiPaymentMethod): PaymentMethod => (method === 'CARD' ? 'Tarjeta' : method === 'BANK_TRANSFER' ? 'Transferencia' : 'Contra entrega');
const paymentStatusToApi = (status: PaymentStatus): ApiPaymentStatus =>
  status === 'Pagado' ? 'PAID' : status === 'Fallido' ? 'FAILED' : status === 'Reembolsado' ? 'REFUNDED' : 'PENDING';
const paymentStatusFromApi = (status?: ApiPaymentStatus): PaymentStatus =>
  status === 'PAID' || status === 'AUTHORIZED' ? 'Pagado' : status === 'FAILED' || status === 'CANCELLED' ? 'Fallido' : status === 'REFUNDED' ? 'Reembolsado' : 'Pendiente';
const statusToApi = (status: Order['status']): ApiOrderStatus =>
  status === 'Entregado' ? 'DELIVERED' : status === 'Enviado' ? 'SHIPPED' : status === 'Procesando' ? 'PREPARING' : 'PENDING_PAYMENT';
const statusFromApi = (status: ApiOrderStatus) =>
  status === 'SHIPPED' || status === 'READY_TO_SHIP'
    ? 'Enviado'
    : status === 'DELIVERED'
      ? 'Entregado'
      : status === 'PREPARING' || status === 'PAID'
        ? 'Procesando'
        : 'Pendiente';

export async function createServerOrder(
  user: User,
  cart: CartItem[],
  products: Product[],
  shipping: ShippingData,
  paymentMethod: PaymentMethod,
  paymentReference?: string,
) {
  const items = cart.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product?.defaultVariantId) throw Error(`${product?.name ?? 'Product'} is not available for checkout.`);

    return { variantId: product.defaultVariantId, quantity: item.quantity };
  });
  const notes = [shipping.notes, paymentReference ? `Payment reference: ${paymentReference}` : undefined].filter(Boolean).join('\n');
  const order = await apiRequest<ApiOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      items,
      shipping: {
        recipientName: shipping.fullName,
        phone: shipping.phone,
        province: shipping.province,
        city: shipping.city,
        line1: shipping.address,
        reference: shipping.notes,
      },
      paymentMethod: paymentToApi(paymentMethod),
      paymentReference: paymentReference?.trim() || undefined,
      customerEmail: shipping.email,
      notes,
    }),
  });

  return mapApiOrder(order, user, products, paymentMethod, paymentReference);
}

export async function fetchServerOrders(user: User, products: Product[]) {
  const path = user.role === 'admin' ? '/orders/admin' : '/orders';
  const orders = await apiRequest<ApiOrder[]>(path);
  return orders.map((order) => mapApiOrder(order, user, products));
}

export async function fetchTrackedOrder(code: string, products: Product[]) {
  const order = await apiRequest<ApiOrder>(`/orders/track/${encodeURIComponent(code.trim())}`);
  return mapApiOrder(order, undefined, products);
}

export async function updateServerOrderStatus(orderId: string, status: Order['status'], user: User, products: Product[]) {
  const order = await apiRequest<ApiOrder>(`/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: statusToApi(status) }),
  });
  return mapApiOrder(order, user, products);
}

export async function updateServerPaymentStatus(orderId: string, paymentStatus: PaymentStatus, user: User, products: Product[]) {
  const order = await apiRequest<ApiOrder>(`/orders/${encodeURIComponent(orderId)}/payment-status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: paymentStatusToApi(paymentStatus) }),
  });
  return mapApiOrder(order, user, products);
}

function mapApiOrder(order: ApiOrder, user: User | undefined, products: Product[], fallbackPayment: PaymentMethod = 'Contra entrega', paymentReference?: string): Order {
  const items = order.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return {
      productId: item.productId,
      name: item.name,
      price: Number(item.unitPrice),
      quantity: item.quantity,
      image: product?.image ?? '',
    };
  });
  const calculated = calculateOrder(items);
  const subtotal = Number(order.subtotal);
  const tax = Number(order.tax);
  const shippingCost = order.shippingCost === undefined && order.shippingTotal === undefined ? calculated.shippingCost : Number(order.shippingCost ?? order.shippingTotal);
  const paymentMethod = order.paymentMethod ?? order.payments?.[0]?.method;
  const payment = order.payments?.[0];

  return {
    id: order.code ?? order.id,
    userId: order.userId ?? user?.id ?? '',
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    createdAt: order.createdAt,
    items,
    subtotal,
    tax,
    shippingCost,
    total: Number(order.total),
    paymentMethod: paymentMethod ? paymentFromApi(paymentMethod) : fallbackPayment,
    paymentStatus: paymentStatusFromApi(payment?.status),
    paymentReference: paymentReference ?? payment?.providerReference ?? parsePaymentReference(order.notes),
    shipping: {
      fullName: order.shippingAddress.recipientName,
      email: order.customerEmail,
      phone: order.shippingAddress.phone,
      province: order.shippingAddress.province,
      address: order.shippingAddress.line1,
      city: order.shippingAddress.city,
      notes: order.shippingAddress.reference,
    },
    status: statusFromApi(order.status),
    statusHistory: (order.statusHistory ?? []).map((entry) => ({ status: statusFromApi(entry.status), date: entry.createdAt })),
    notes: order.notes,
  };
}

function parsePaymentReference(notes?: string) {
  const match = notes?.match(/Payment reference:\s*(.+)/i);
  return match?.[1]?.trim();
}
