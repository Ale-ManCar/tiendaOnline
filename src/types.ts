export type Role = 'customer' | 'admin';
export interface User { id:string; name:string; email:string; role:Role; active:boolean; createdAt:string }
export interface Category { id:string; name:string; slug:string; description?:string; active:boolean; createdAt:string }
export interface Product { id:string; name:string; description:string; category:string; categoryId?:string; defaultVariantId?:string; price:number; stock:number; image:string; featured:boolean; sku:string; active:boolean; createdAt:string; updatedAt:string }
export interface CartItem { productId:string; quantity:number }
export type PaymentMethod = 'Tarjeta'|'Transferencia'|'Contra entrega';
export type OrderStatus = 'Pendiente'|'Procesando'|'Enviado'|'Entregado';
export interface ShippingData { fullName:string; email:string; phone:string; province:string; address:string; city:string; notes?:string }
export interface OrderItem { productId:string; name:string; price:number; quantity:number; image:string }
export interface StatusHistoryEntry { status:OrderStatus; date:string }
export interface Order { id:string; userId:string; customerName:string; customerEmail:string; createdAt:string; items:OrderItem[]; subtotal:number; tax:number; total:number; paymentMethod:PaymentMethod; paymentReference?:string; shipping:ShippingData; status:OrderStatus; statusHistory:StatusHistoryEntry[]; notes?:string }
export type Result = { ok:boolean; message:string };
