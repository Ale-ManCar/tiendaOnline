import type { Role, User } from '../types';
import { ApiError, apiRequest } from './apiClient';

type ApiUser = { id: string; name: string; email: string; role: 'CUSTOMER'|'ADMIN'|'CATALOG_MANAGER'|'FULFILLMENT'|'SUPPORT' };
type AuthResponse = { user: ApiUser };
const mapUser = (user: ApiUser): User => ({ id:user.id,name:user.name,email:user.email,role:(user.role === 'ADMIN' ? 'admin' : 'customer') as Role,active:true,createdAt:new Date().toISOString() });
const request = (path:string,body?:unknown) => apiRequest<AuthResponse>(path,{method:'POST',body:body?JSON.stringify(body):undefined});

export async function registerAccount(name:string,email:string,password:string){return mapUser((await request('/auth/register',{name,email,password})).user)}
export async function loginAccount(email:string,password:string){return mapUser((await request('/auth/login',{email,password})).user)}
export async function restoreSession(){
  try{return mapUser((await apiRequest<AuthResponse>('/auth/me')).user)}catch(error){
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    try{await request('/auth/refresh');return mapUser((await apiRequest<AuthResponse>('/auth/me')).user)}catch{return null}
  }
}
export async function logoutAccount(){await apiRequest<void>('/auth/logout',{method:'POST'})}
