import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CartItem, Category, Order, OrderStatus, PaymentMethod, PaymentStatus, Product, Result, ShippingData, User } from '../types';
import { cartKey, KEYS, readStorage, uid, writeStorage } from '../utils/storage';
import { loginAccount, logoutAccount, registerAccount, restoreSession } from '../services/authService';
import { fetchStorefrontCatalog } from '../services/catalogService';
import { calculateOrder, createServerOrder, fetchServerOrders, updateServerOrderStatus, updateServerPaymentStatus } from '../services/orderService';
import { fetchServerCart, syncServerCart } from '../services/cartService';
import { fetchServerSettings, saveServerSettings } from '../services/settingsService';
import {
  createServerCategory,
  createServerProduct,
  deleteServerCategory,
  deleteServerProduct,
  updateServerCategory,
  updateServerProduct,
} from '../services/adminCatalogService';
import { isApiUnavailable } from '../services/demoMode';
import { loadStoreSettings, resetStoreSettings, saveStoreSettings, storeConfig, type StoreSettings } from '../config/storeConfig';

const now = () => new Date().toISOString();
const round = (value: number) => Number(value.toFixed(2));
const CART_REFRESH_INTERVAL_MS = 4_000;
const slugify = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const admin: User = {
  id: 'user-admin',
  name: 'Administrador principal',
  email: storeConfig.demoAdminEmail,
  role: 'admin',
  active: true,
  createdAt: now(),
};

interface StoreValue {
  products: Product[];
  users: User[];
  categories: Category[];
  catalogLoading: boolean;
  catalogError: string | null;
  currentUser: User | null;
  authReady: boolean;
  cart: CartItem[];
  orders: Order[];
  storeSettings: StoreSettings;
  cartCount: number;
  cartSubtotal: number;
  register: (name: string, email: string, password: string) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  addToCart: (id: string, quantity?: number) => Result;
  updateCartQuantity: (id: string, quantity: number) => Result;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  createOrder: (shipping: ShippingData, paymentMethod: PaymentMethod, reference?: string) => Promise<Order>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Result>;
  updateProduct: (product: Product) => Promise<Result>;
  deleteProduct: (id: string) => Promise<Result>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'slug'>) => Promise<Result>;
  updateCategory: (category: Category) => Promise<Result>;
  deleteCategory: (id: string) => Promise<Result>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<Result>;
  updatePaymentStatus: (id: string, status: PaymentStatus) => Promise<Result>;
  toggleUser: (id: string) => Result;
  updateStoreSettings: (settings: StoreSettings) => Promise<Result>;
  restoreDefaultStoreSettings: () => Result;
  exportStoreBackup: () => StoreBackup;
  restoreStoreBackup: (backup: unknown) => Result;
}

const Context = createContext<StoreValue | undefined>(undefined);

export type StoreBackup = {
  version: 1;
  exportedAt: string;
  products: Product[];
  categories: Category[];
  users: User[];
  orders: Order[];
  settings: StoreSettings;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = readStorage<Partial<User>[]>(KEYS.users, [])
      .filter((user) => user.id && user.name && user.email && user.role)
      .map((user) => ({
        id: user.id!,
        name: user.name!,
        email: user.email!,
        role: user.role!,
        active: user.active ?? true,
        createdAt: user.createdAt ?? now(),
      }));

    return storedUsers.some((user) => user.email === admin.email) ? storedUsers : [admin, ...storedUsers];
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => readStorage(cartKey(), readStorage(KEYS.legacyCart, [])));
  const [orders, setOrders] = useState<Order[]>(() => readStorage(KEYS.orders, []));
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => loadStoreSettings());
  const [cartHydrated, setCartHydrated] = useState(false);
  const pendingGuestCartRef = useRef<CartItem[]>([]);
  const syncingCartRef = useRef(false);

  useEffect(() => writeStorage(KEYS.users, users), [users]);
  useEffect(() => writeStorage(KEYS.orders, orders), [orders]);
  useEffect(() => writeStorage(cartKey(currentUser?.id), cart), [cart, currentUser]);

  const loadCatalog = async () => {
    const data = await fetchStorefrontCatalog();
    setProducts(data.products);
    setCategories(data.categories);
    setCatalogError(null);
  };

  useEffect(() => {
    let active = true;
    fetchStorefrontCatalog()
      .then((data) => {
        if (!active) return;
        setProducts(data.products);
        setCategories(data.categories);
        setCatalogError(null);
      })
      .catch((error) => {
        if (!active) return;
        if (storeConfig.enableDemoFallback && isApiUnavailable(error)) {
          setProducts(readStorage<Product[]>(KEYS.products, []));
          setCategories(readStorage<Category[]>(KEYS.categories, []));
        }
        setCatalogError(error instanceof Error ? error.message : 'Could not load the catalog.');
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchServerSettings()
      .then((settings) => {
        if (active && settings) setStoreSettings(saveStoreSettings(settings));
      })
      .catch((error) => {
        if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) {
          console.warn('Could not load store settings from the backend.', error);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    restoreSession()
      .then((user) => {
        if (!active) return;
        setCurrentUser(user);
        if (user) setCart([]);
        if (!user) setCartHydrated(true);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !currentUser || products.length === 0) return;

    let active = true;
    const hydrationFallback = window.setTimeout(() => {
      if (active) setCartHydrated(true);
    }, 5000);

    fetchServerCart()
      .then((serverCart) => {
        if (!active) return;
        if (syncingCartRef.current) return;
        const guestCart = pendingGuestCartRef.current;
        pendingGuestCartRef.current = [];
        const nextCart = guestCart.length ? mergeCarts(serverCart, guestCart, products) : normalizeCart(serverCart, products);
        setCart((currentCart) => (cartsEqual(currentCart, nextCart) ? currentCart : nextCart));
      })
      .catch((error) => {
        if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) {
          console.warn('Could not load persisted cart from the backend.', error);
        }
      })
      .finally(() => {
        window.clearTimeout(hydrationFallback);
        if (active) setCartHydrated(true);
      });

    return () => {
      active = false;
      window.clearTimeout(hydrationFallback);
    };
  }, [authReady, currentUser?.id, products]);

  useEffect(() => {
    if (!authReady || !currentUser || !cartHydrated || products.length === 0) return;
    syncingCartRef.current = true;
    syncServerCart(cart, products)
      .then((serverCart) => {
        const normalized = normalizeCart(serverCart, products);
        setCart((currentCart) => (cartsEqual(currentCart, normalized) ? currentCart : normalized));
      })
      .catch((error) => {
        if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) {
          console.warn('Could not persist cart to the backend.', error);
        }
      })
      .finally(() => {
        syncingCartRef.current = false;
      });
  }, [authReady, currentUser?.id, cartHydrated, cart, products]);

  useEffect(() => {
    if (!authReady || !currentUser || !cartHydrated || products.length === 0) return;
    const refreshCart = () => {
      if (syncingCartRef.current) return;
      fetchServerCart()
        .then((serverCart) => {
          const normalized = normalizeCart(serverCart, products);
          setCart((currentCart) => (cartsEqual(currentCart, normalized) ? currentCart : normalized));
        })
        .catch((error) => {
          if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) {
            console.warn('Could not refresh cart from the backend.', error);
          }
        });
    };
    const timer = window.setInterval(refreshCart, CART_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', refreshCart);
    document.addEventListener('visibilitychange', refreshCart);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshCart);
      document.removeEventListener('visibilitychange', refreshCart);
    };
  }, [authReady, currentUser?.id, cartHydrated, products]);

  useEffect(() => {
    setCart((oldCart) =>
      oldCart
        .filter((item) => {
          const product = products.find((candidate) => candidate.id === item.productId);
          return product?.active && item.quantity > 0;
        })
        .map((item) => ({
          ...item,
          quantity: Math.min(item.quantity, products.find((product) => product.id === item.productId)?.stock ?? 0),
        }))
        .filter((item) => item.quantity > 0),
    );
  }, [products]);

  useEffect(() => {
    if (!authReady || !currentUser || products.length === 0) return;

    let active = true;
    fetchServerOrders(currentUser, products)
      .then((serverOrders) => {
        if (active) setOrders(serverOrders);
      })
      .catch((error) => {
        if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) {
          console.warn('Could not load persisted orders from the backend.', error);
        }
      });

    return () => {
      active = false;
    };
  }, [authReady, currentUser?.id, currentUser?.role, products]);

  const register = async (name: string, email: string, password: string): Promise<Result> => {
    try {
      const { user, verificationRequired } = await registerAccount(name, email, password);
      if (verificationRequired) {
        return { ok: true, message: 'Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.' };
      }
      const guestCart = readStorage<CartItem[]>(cartKey(), []);
      pendingGuestCartRef.current = guestCart;
      setCurrentUser(user);
      setCart(normalizeCart(guestCart, products));
      setCartHydrated(false);
      writeStorage(cartKey(), []);
      return { ok: true, message: 'Cuenta creada correctamente.' };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear la cuenta.' };
    }
  };

  const login = async (email: string, password: string): Promise<Result> => {
    try {
      const user = await loginAccount(email, password);
      const guestCart = readStorage<CartItem[]>(cartKey(), []);
      pendingGuestCartRef.current = guestCart;
      setCurrentUser(user);
      setCart(normalizeCart(guestCart, products));
      setCartHydrated(false);
      writeStorage(cartKey(), []);
      return { ok: true, message: `Bienvenido, ${user.name}.` };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'No se pudo iniciar sesión.' };
    }
  };

  const logout = async () => {
    try {
      await logoutAccount();
    } finally {
      setCurrentUser(null);
      setCartHydrated(true);
      setCart(readStorage(cartKey(), []));
    }
  };

  const addToCart = (id: string, quantity = 1): Result => {
    if (currentUser && !cartHydrated) return { ok: false, message: 'Estamos sincronizando tu carrito. Intenta nuevamente en un momento.' };
    const product = products.find((candidate) => candidate.id === id && candidate.active);
    if (!product || product.stock < 1) return { ok: false, message: 'Producto no disponible.' };

    const currentQuantity = cart.find((item) => item.productId === id)?.quantity ?? 0;
    if (!Number.isInteger(quantity) || quantity < 1 || currentQuantity + quantity > product.stock) {
      return { ok: false, message: `Solo hay ${product.stock} unidades disponibles.` };
    }

    if (currentUser) syncingCartRef.current = true;
    setCart((currentCart) =>
      currentCart.some((item) => item.productId === id)
        ? currentCart.map((item) => (item.productId === id ? { ...item, quantity: item.quantity + quantity } : item))
        : [...currentCart, { productId: id, quantity }],
    );
    return { ok: true, message: 'Producto agregado al carrito.' };
  };

  const updateCartQuantity = (id: string, quantity: number): Result => {
    if (currentUser && !cartHydrated) return { ok: false, message: 'Estamos sincronizando tu carrito. Intenta nuevamente en un momento.' };
    const product = products.find((candidate) => candidate.id === id);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      return { ok: false, message: `Cantidad válida: 1 a ${product?.stock ?? 0}.` };
    }

    if (currentUser) syncingCartRef.current = true;
    setCart((currentCart) => currentCart.map((item) => (item.productId === id ? { ...item, quantity } : item)));
    return { ok: true, message: 'Cantidad actualizada.' };
  };

  const removeFromCart = (id: string) => {
    if (currentUser && !cartHydrated) return;
    if (currentUser) syncingCartRef.current = true;
    setCart((currentCart) => currentCart.filter((item) => item.productId !== id));
  };

  const clearCart = () => {
    if (currentUser && !cartHydrated) return;
    if (currentUser) syncingCartRef.current = true;
    setCart([]);
  };

  const createOrder = async (shipping: ShippingData, paymentMethod: PaymentMethod, paymentReference?: string) => {
    if (!currentUser) throw Error('Debes iniciar sesión.');
    if (!cart.length) throw Error('El carrito está vacío.');

    let order: Order;
    try {
      order = await createServerOrder(currentUser, cart, products, shipping, paymentMethod, paymentReference);
    } catch (error) {
      if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) throw error;
      order = createLocalOrder(currentUser, cart, products, shipping, paymentMethod, paymentReference);
    }

    const date = now();
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const item = cart.find((candidate) => candidate.productId === product.id);
        return item ? { ...product, stock: Math.max(0, product.stock - item.quantity), updatedAt: date } : product;
      }),
    );
    setOrders((currentOrders) => [{ ...order, paymentReference: paymentMethod === 'Transferencia' ? paymentReference : undefined }, ...currentOrders]);
    setCart([]);
    syncServerCart([], products).catch((error) => {
      if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) {
        console.warn('Could not clear persisted cart after creating the order.', error);
      }
    });
    loadCatalog().catch((error) => {
      if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) {
        console.warn('Could not refresh catalog stock after creating the order.', error);
      }
    });
    return order;
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result> => {
    if (products.some((candidate) => candidate.sku.toLowerCase() === product.sku.trim().toLowerCase())) {
      return { ok: false, message: 'El SKU ya existe.' };
    }

    try {
      const serverProduct = await createServerProduct(product);
      setProducts((currentProducts) => [serverProduct, ...currentProducts]);
      return { ok: true, message: 'Producto creado en el backend.' };
    } catch (error) {
      if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear el producto.' };
      const date = now();
      setProducts((currentProducts) => [{ ...product, id: uid('product'), createdAt: date, updatedAt: date }, ...currentProducts]);
      return { ok: true, message: 'Producto creado localmente.' };
    }
  };

  const updateProduct = async (product: Product): Promise<Result> => {
    if (products.some((candidate) => candidate.id !== product.id && candidate.sku.toLowerCase() === product.sku.toLowerCase())) {
      return { ok: false, message: 'El SKU ya existe.' };
    }

    try {
      const serverProduct = await updateServerProduct(product);
      setProducts((currentProducts) => currentProducts.map((item) => (item.id === product.id ? serverProduct : item)));
      return { ok: true, message: 'Producto actualizado en el backend.' };
    } catch (error) {
      if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar el producto.' };
      setProducts((currentProducts) => currentProducts.map((item) => (item.id === product.id ? { ...product, updatedAt: now() } : item)));
      return { ok: true, message: 'Producto actualizado localmente.' };
    }
  };

  const deleteProduct = async (id: string): Promise<Result> => {
    try {
      await deleteServerProduct(id);
      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id));
      return { ok: true, message: 'Producto archivado en el backend.' };
    } catch (error) {
      if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) return { ok: false, message: error instanceof Error ? error.message : 'No se pudo eliminar el producto.' };
      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id));
      return { ok: true, message: 'Producto eliminado localmente.' };
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'slug'>): Promise<Result> => {
    const name = category.name.trim();
    const slug = slugify(name);
    if (categories.some((candidate) => candidate.slug === slug)) return { ok: false, message: 'La categoría ya existe.' };

    try {
      const serverCategory = await createServerCategory({ ...category, name });
      setCategories((currentCategories) => [...currentCategories, serverCategory]);
      return { ok: true, message: 'Categoría creada en el backend.' };
    } catch (error) {
      if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear la categoría.' };
      setCategories((currentCategories) => [...currentCategories, { ...category, name, slug, id: uid('cat'), createdAt: now() }]);
      return { ok: true, message: 'Categoría creada localmente.' };
    }
  };

  const updateCategory = async (category: Category): Promise<Result> => {
    const currentCategory = categories.find((candidate) => candidate.id === category.id);
    if (!currentCategory) return { ok: false, message: 'Categoría no encontrada.' };

    const name = category.name.trim();
    const slug = slugify(name);
    if (categories.some((candidate) => candidate.id !== category.id && (candidate.slug === slug || candidate.name.toLowerCase() === name.toLowerCase()))) {
      return { ok: false, message: 'Nombre o slug duplicado.' };
    }

    const nextCategory = { ...category, name, slug, description: category.description?.trim() };
    try {
      const serverCategory = await updateServerCategory(nextCategory);
      setCategories((currentCategories) => currentCategories.map((candidate) => (candidate.id === category.id ? serverCategory : candidate)));
    } catch (error) {
      if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar la categoría.' };
      setCategories((currentCategories) => currentCategories.map((candidate) => (candidate.id === category.id ? nextCategory : candidate)));
    }
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.categoryId === category.id || product.category === currentCategory.name
          ? { ...product, category: name, categoryId: category.id, updatedAt: now() }
          : product,
      ),
    );
    return { ok: true, message: 'Categoría actualizada.' };
  };

  const deleteCategory = async (id: string): Promise<Result> => {
    const category = categories.find((candidate) => candidate.id === id);
    if (category && products.some((product) => product.category === category.name || product.categoryId === id)) {
      return { ok: false, message: 'No se puede eliminar: tiene productos asignados.' };
    }

    try {
      await deleteServerCategory(id);
      setCategories((currentCategories) => currentCategories.filter((category) => category.id !== id));
      return { ok: true, message: 'Categoría eliminada del backend.' };
    } catch (error) {
      if (!storeConfig.enableDemoFallback || !isApiUnavailable(error)) return { ok: false, message: error instanceof Error ? error.message : 'No se pudo eliminar la categoría.' };
      setCategories((currentCategories) => currentCategories.filter((category) => category.id !== id));
      return { ok: true, message: 'Categoría eliminada localmente.' };
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus): Promise<Result> => {
    const previousOrders = orders;
    const optimisticDate = now();
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === id ? { ...order, status, statusHistory: [...(order.statusHistory ?? []), { status, date: optimisticDate }] } : order,
      ),
    );

    try {
      if (!currentUser) throw Error('Debes iniciar sesión.');
      const serverOrder = await updateServerOrderStatus(id, status, currentUser, products);
      setOrders((currentOrders) => currentOrders.map((order) => (order.id === id ? serverOrder : order)));
      return { ok: true, message: 'Estado actualizado en el backend.' };
    } catch (error) {
      if (storeConfig.enableDemoFallback && isApiUnavailable(error)) return { ok: true, message: 'Estado actualizado localmente.' };
      setOrders(previousOrders);
      return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar el estado.' };
    }
  };

  const updatePaymentStatus = async (id: string, status: PaymentStatus): Promise<Result> => {
    const previousOrders = orders;
    setOrders((currentOrders) => currentOrders.map((order) => (order.id === id ? { ...order, paymentStatus: status } : order)));

    try {
      if (!currentUser) throw Error('Debes iniciar sesión.');
      const serverOrder = await updateServerPaymentStatus(id, status, currentUser, products);
      setOrders((currentOrders) => currentOrders.map((order) => (order.id === id ? serverOrder : order)));
      return { ok: true, message: 'Estado de pago actualizado.' };
    } catch (error) {
      if (storeConfig.enableDemoFallback && isApiUnavailable(error)) return { ok: true, message: 'Estado de pago actualizado localmente.' };
      setOrders(previousOrders);
      return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar el pago.' };
    }
  };

  const toggleUser = (id: string): Result => {
    if (id === admin.id) return { ok: false, message: 'No se puede desactivar al administrador principal.' };
    setUsers((currentUsers) => currentUsers.map((user) => (user.id === id ? { ...user, active: !user.active } : user)));
    return { ok: true, message: 'Estado de cuenta actualizado.' };
  };

  const updateStoreSettings = async (settings: StoreSettings): Promise<Result> => {
    const normalized = saveStoreSettings(settings);
    setStoreSettings(normalized);
    try {
      const serverSettings = await saveServerSettings(normalized);
      setStoreSettings(saveStoreSettings(serverSettings));
      return { ok: true, message: 'Configuración guardada en el backend.' };
    } catch (error) {
      if (storeConfig.enableDemoFallback && isApiUnavailable(error)) return { ok: true, message: 'Configuración guardada localmente.' };
      return { ok: false, message: error instanceof Error ? error.message : 'No se pudo guardar la configuración.' };
    }
  };

  const restoreDefaultStoreSettings = (): Result => {
    setStoreSettings(resetStoreSettings());
    return { ok: true, message: 'Configuración original restaurada.' };
  };

  const exportStoreBackup = (): StoreBackup => ({
    version: 1,
    exportedAt: now(),
    products,
    categories,
    users,
    orders,
    settings: storeSettings,
  });

  const restoreStoreBackup = (backup: unknown): Result => {
    if (!backup || typeof backup !== 'object') return { ok: false, message: 'Archivo de respaldo inválido.' };
    const candidate = backup as Partial<StoreBackup>;
    if (!Array.isArray(candidate.products) || !Array.isArray(candidate.categories) || !Array.isArray(candidate.users) || !Array.isArray(candidate.orders) || !candidate.settings) {
      return { ok: false, message: 'El respaldo no tiene la estructura esperada.' };
    }

    const nextUsers = candidate.users.some((user) => user.email === admin.email) ? candidate.users : [admin, ...candidate.users];
    setProducts(candidate.products);
    setCategories(candidate.categories);
    setUsers(nextUsers);
    setOrders(candidate.orders);
    setStoreSettings(saveStoreSettings(candidate.settings));
    setCart([]);
    return { ok: true, message: 'Respaldo restaurado correctamente.' };
  };

  const cartSubtotal = round(cart.reduce((sum, item) => sum + (products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0));

  const value = useMemo(
    () => ({
      products,
      users,
      categories,
      catalogLoading,
      catalogError,
      currentUser,
      authReady,
      cart,
      orders,
      storeSettings,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      cartSubtotal,
      register,
      login,
      logout,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      createOrder,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      updateOrderStatus,
      updatePaymentStatus,
      toggleUser,
      updateStoreSettings,
      restoreDefaultStoreSettings,
      exportStoreBackup,
      restoreStoreBackup,
    }),
    [products, users, categories, catalogLoading, catalogError, currentUser, authReady, cart, orders, storeSettings, cartSubtotal],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

function mergeCarts(firstCart: CartItem[], secondCart: CartItem[], products: Product[]) {
  const map = new Map<string, number>();
  [...firstCart, ...secondCart].forEach((item) => map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity));

  return normalizeCart(
    [...map].map(([productId, quantity]) => ({ productId, quantity })),
    products,
  );
}

function normalizeCart(cart: CartItem[], products: Product[]) {
  return cart.flatMap(({ productId, quantity }) => {
    const product = products.find((candidate) => candidate.id === productId && candidate.active);
    return product && product.stock ? [{ productId, quantity: Math.min(quantity, product.stock) }] : [];
  });
}

function cartsEqual(firstCart: CartItem[], secondCart: CartItem[]) {
  if (firstCart.length !== secondCart.length) return false;
  const first = [...firstCart].sort((a, b) => a.productId.localeCompare(b.productId));
  const second = [...secondCart].sort((a, b) => a.productId.localeCompare(b.productId));
  return first.every((item, index) => item.productId === second[index]?.productId && item.quantity === second[index]?.quantity);
}

function createLocalOrder(
  user: User,
  cart: CartItem[],
  products: Product[],
  shipping: ShippingData,
  paymentMethod: PaymentMethod,
  paymentReference?: string,
): Order {
  const items = cart.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId && candidate.active);
    if (!product || product.stock < item.quantity) throw Error('Stock changed. Review your cart.');

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.image,
    };
  });
  const totals = calculateOrder(items);
  const date = now();

  return {
    id: `NV-${uid('').replace(/[^a-z0-9]/gi, '').slice(-12).toUpperCase()}`,
    userId: user.id,
    customerName: shipping.fullName,
    customerEmail: shipping.email,
    createdAt: date,
    items,
    subtotal: totals.subtotal,
    tax: totals.tax,
    shippingCost: totals.shippingCost,
    total: totals.total,
    paymentMethod,
    paymentStatus: paymentMethod === 'Contra entrega' ? 'Pendiente' : 'Pendiente',
    paymentReference,
    shipping,
    status: 'Pendiente',
    statusHistory: [{ status: 'Pendiente', date }],
    notes: shipping.notes,
  };
}

export function useStore() {
  const context = useContext(Context);
  if (!context) throw Error('useStore debe utilizarse dentro de StoreProvider.');
  return context;
}
