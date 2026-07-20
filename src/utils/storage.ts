export const STORAGE_VERSION = 2;
export const KEYS = { products:'nova_products', users:'nova_users', session:'nova_current_user', orders:'nova_orders', categories:'nova_categories', settings:'nova_store_settings', guestCart:'nova_cart_guest', legacyCart:'nova_cart' } as const;
type Envelope<T>={version:number;data:T};
export function readStorage<T>(key:string,fallback:T):T { try { const raw=localStorage.getItem(key); if(!raw)return fallback; const value:unknown=JSON.parse(raw); if(value&&typeof value==='object'&&'version' in value&&'data' in value)return (value as Envelope<T>).data; return value as T; } catch { localStorage.removeItem(key); return fallback; } }
export function writeStorage<T>(key:string,value:T){ try{localStorage.setItem(key,JSON.stringify({version:STORAGE_VERSION,data:value}));}catch{/* Storage may be unavailable or full. */} }
export function hashPassword(value:string){let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}return `h${(hash>>>0).toString(16)}`}
export function uid(prefix:string){const id=globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;return `${prefix}-${id}`}
export const cartKey=(userId?:string)=>userId?`nova_cart_user_${userId}`:KEYS.guestCart;
