import type { Order, ShippingData } from '../types';

const fallbackShipping: ShippingData = {
  fullName: 'Cliente sin nombre',
  email: 'Correo no registrado',
  phone: 'Teléfono no registrado',
  province: 'Provincia no registrada',
  address: 'Dirección no registrada',
  city: 'Ciudad no registrada',
};

export function getOrderShipping(order: Partial<Order>): ShippingData {
  return {
    ...fallbackShipping,
    ...(order.shipping ?? {}),
    fullName: order.shipping?.fullName || order.customerName || fallbackShipping.fullName,
    email: order.shipping?.email || order.customerEmail || fallbackShipping.email,
  };
}

export function formatMoney(value: unknown): string {
  return `$${safeMoney(value).toFixed(2)}`;
}

export function formatShippingCost(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'No registrado';

  const amount = safeMoney(value);
  return amount === 0 ? 'Gratis' : formatMoney(amount);
}

export function getOrderTotal(order: Partial<Order>): number {
  return safeMoney(order.total);
}

function safeMoney(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}
