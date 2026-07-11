export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  featured: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type PaymentMethod = 'Tarjeta' | 'Transferencia' | 'Contra entrega';
export type OrderStatus = 'Pendiente' | 'Procesando' | 'Enviado' | 'Entregado';

export interface ShippingData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  shipping: ShippingData;
  status: OrderStatus;
}
