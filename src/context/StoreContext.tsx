import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seedProducts } from '../data/products';
import type { CartItem, Order, OrderStatus, PaymentMethod, Product, ShippingData, User } from '../types';
import { hashPassword, readStorage, uid, writeStorage } from '../utils/storage';

interface StoreContextValue {
  products: Product[];
  users: User[];
  currentUser: User | null;
  cart: CartItem[];
  orders: Order[];
  cartCount: number;
  cartSubtotal: number;
  register: (name: string, email: string, password: string) => { ok: boolean; message: string };
  login: (email: string, password: string) => { ok: boolean; message: string };
  logout: () => void;
  addToCart: (productId: string, quantity?: number) => { ok: boolean; message: string };
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createOrder: (shipping: ShippingData, paymentMethod: PaymentMethod) => Order;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const KEYS = {
  products: 'nova_products',
  users: 'nova_users',
  currentUser: 'nova_current_user',
  cart: 'nova_cart',
  orders: 'nova_orders',
};

const adminUser: User = {
  id: 'user-admin',
  name: 'Administrador',
  email: 'admin@tienda.com',
  passwordHash: hashPassword('Admin123*'),
  role: 'admin',
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => readStorage(KEYS.products, seedProducts));
  const [users, setUsers] = useState<User[]>(() => {
    const stored = readStorage<User[]>(KEYS.users, []);
    return stored.some((user) => user.email === adminUser.email) ? stored : [adminUser, ...stored];
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => readStorage<User | null>(KEYS.currentUser, null));
  const [cart, setCart] = useState<CartItem[]>(() => readStorage(KEYS.cart, []));
  const [orders, setOrders] = useState<Order[]>(() => readStorage(KEYS.orders, []));

  useEffect(() => writeStorage(KEYS.products, products), [products]);
  useEffect(() => writeStorage(KEYS.users, users), [users]);
  useEffect(() => writeStorage(KEYS.currentUser, currentUser), [currentUser]);
  useEffect(() => writeStorage(KEYS.cart, cart), [cart]);
  useEffect(() => writeStorage(KEYS.orders, orders), [orders]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const register = (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((user) => user.email === normalizedEmail)) {
      return { ok: false, message: 'Ya existe una cuenta con este correo.' };
    }
    const user: User = {
      id: uid('user'),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: 'customer',
    };
    setUsers((previous) => [...previous, user]);
    setCurrentUser(user);
    return { ok: true, message: 'Cuenta creada correctamente.' };
  };

  const login = (email: string, password: string) => {
    const user = users.find(
      (candidate) => candidate.email === email.trim().toLowerCase() && candidate.passwordHash === hashPassword(password),
    );
    if (!user) return { ok: false, message: 'Correo o contraseña incorrectos.' };
    setCurrentUser(user);
    return { ok: true, message: `Bienvenido, ${user.name}.` };
  };

  const logout = () => setCurrentUser(null);

  const addToCart = (productId: string, quantity = 1) => {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product || product.stock <= 0) return { ok: false, message: 'Producto sin stock disponible.' };
    const currentQuantity = cart.find((item) => item.productId === productId)?.quantity ?? 0;
    if (currentQuantity + quantity > product.stock) {
      return { ok: false, message: `Solo hay ${product.stock} unidades disponibles.` };
    }
    setCart((previous) => {
      const exists = previous.some((item) => item.productId === productId);
      return exists
        ? previous.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item))
        : [...previous, { productId, quantity }];
    });
    return { ok: true, message: 'Producto agregado al carrito.' };
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) return;
    const safeQuantity = Math.max(1, Math.min(quantity, product.stock));
    setCart((previous) => previous.map((item) => (item.productId === productId ? { ...item, quantity: safeQuantity } : item)));
  };

  const removeFromCart = (productId: string) => setCart((previous) => previous.filter((item) => item.productId !== productId));
  const clearCart = () => setCart([]);

  const createOrder = (shipping: ShippingData, paymentMethod: PaymentMethod) => {
    if (!currentUser) throw new Error('Debes iniciar sesión para comprar.');
    if (cart.length === 0) throw new Error('El carrito está vacío.');

    const items = cart.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product || product.stock < item.quantity) throw new Error('Uno de los productos no tiene stock suficiente.');
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      };
    });

    const subtotal = Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
    const tax = Number((subtotal * 0.15).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const order: Order = {
      id: `NV-${Date.now().toString().slice(-8)}`,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      shipping,
      status: 'Pendiente',
    };

    setOrders((previous) => [order, ...previous]);
    setProducts((previous) =>
      previous.map((product) => {
        const ordered = items.find((item) => item.productId === product.id);
        return ordered ? { ...product, stock: product.stock - ordered.quantity } : product;
      }),
    );
    clearCart();
    return order;
  };

  const addProduct = (product: Omit<Product, 'id'>) => setProducts((previous) => [{ ...product, id: uid('product') }, ...previous]);
  const updateProduct = (product: Product) => setProducts((previous) => previous.map((candidate) => (candidate.id === product.id ? product : candidate)));
  const deleteProduct = (productId: string) => {
    setProducts((previous) => previous.filter((product) => product.id !== productId));
    setCart((previous) => previous.filter((item) => item.productId !== productId));
  };
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((previous) => previous.map((order) => (order.id === orderId ? { ...order, status } : order)));
  };

  const value = useMemo<StoreContextValue>(
    () => ({
      products,
      users,
      currentUser,
      cart,
      orders,
      cartCount,
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
      updateOrderStatus,
    }),
    [products, users, currentUser, cart, orders, cartCount, cartSubtotal],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore debe utilizarse dentro de StoreProvider.');
  return context;
}
