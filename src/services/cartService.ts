import type { CartItem, Product } from '../types';
import { apiRequest } from './apiClient';

type ApiCart = { items: { productId: string; variantId: string; quantity: number }[] };

export async function fetchServerCart() {
  const cart = await apiRequest<ApiCart>('/cart');
  return cart.items.map(({ productId, quantity }) => ({ productId, quantity }));
}

export async function syncServerCart(cart: CartItem[], products: Product[]) {
  const items = cart.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return product?.defaultVariantId ? [{ variantId: product.defaultVariantId, quantity: item.quantity }] : [];
  });
  const response = await apiRequest<ApiCart>('/cart', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
  return response.items.map(({ productId, quantity }) => ({ productId, quantity }));
}
