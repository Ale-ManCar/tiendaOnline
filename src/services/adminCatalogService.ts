import type { Category, Product } from '../types';
import { apiRequest } from './apiClient';

type ApiVariant = { id: string; sku: string; price: number; availableStock: number };
type ApiProduct = {
  id: string;
  name: string;
  description: string;
  category: { id: string; name: string };
  price: number;
  stock: number;
  image: string;
  featured: boolean;
  sku: string;
  variants?: ApiVariant[];
  createdAt: string;
  updatedAt: string;
};
type ApiCategory = Category & { productCount?: number };

const mapProduct = (product: ApiProduct): Product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  category: product.category.name,
  categoryId: product.category.id,
  defaultVariantId: product.variants?.[0]?.id,
  price: product.price,
  stock: product.stock,
  image: product.image,
  featured: product.featured,
  sku: product.sku,
  active: true,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export async function createServerProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  return mapProduct(await apiRequest<ApiProduct>('/catalog/admin/products', { method: 'POST', body: JSON.stringify(product) }));
}

export async function updateServerProduct(product: Product) {
  return mapProduct(await apiRequest<ApiProduct>(`/catalog/admin/products/${encodeURIComponent(product.id)}`, { method: 'PATCH', body: JSON.stringify(product) }));
}

export async function deleteServerProduct(id: string) {
  await apiRequest<{ ok: true }>(`/catalog/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function createServerCategory(category: Omit<Category, 'id' | 'createdAt' | 'slug'>) {
  return apiRequest<ApiCategory>('/catalog/admin/categories', { method: 'POST', body: JSON.stringify(category) });
}

export async function updateServerCategory(category: Category) {
  return apiRequest<ApiCategory>(`/catalog/admin/categories/${encodeURIComponent(category.id)}`, { method: 'PATCH', body: JSON.stringify(category) });
}

export async function deleteServerCategory(id: string) {
  await apiRequest<{ ok: true }>(`/catalog/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
