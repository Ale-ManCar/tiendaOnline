import type { Category, Product } from '../types';
import { storeConfig } from '../config/storeConfig';
import { getDemoCatalog } from '../data/demoCatalogSeed';
import { apiRequest } from './apiClient';
import { isApiUnavailable } from './demoMode';

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
type ProductPage = { data: ApiProduct[]; meta: { page: number; limit: number; total: number; totalPages: number } };
type ApiCategory = Category & { productCount: number };

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

export async function fetchStorefrontCatalog() {
  try {
    const [categories, products] = await Promise.all([
      apiRequest<ApiCategory[]>('/catalog/categories'),
      apiRequest<ProductPage>('/catalog/products?limit=100'),
    ]);
    return { categories, products: products.data.map(mapProduct) };
  } catch (error) {
    if (storeConfig.enableDemoFallback && isApiUnavailable(error)) return getDemoCatalog();
    throw error;
  }
}

export async function fetchStorefrontProduct(id: string) {
  try {
    return mapProduct(await apiRequest<ApiProduct>(`/catalog/products/${encodeURIComponent(id)}`));
  } catch (error) {
    if (storeConfig.enableDemoFallback && isApiUnavailable(error)) {
      const product = getDemoCatalog().products.find((item) => item.id === id);
      if (product) return product;
    }
    throw error;
  }
}
