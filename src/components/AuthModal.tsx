import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { ToastState } from './Toast';

export function AuthModal({ open, onClose, notify }: { open:boolean; onClose:()=>void; notify:(toast:ToastState)=>void }) {
  const { login, register, storeSettings } = useStore();
  const [mode,setMode]=useState<'login'|'register'>('login');
  const [showPassword,setShowPassword]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState('');
  const [form,setForm]=useState({name:'',email:'',password:'',confirmPassword:''});
  if(!open)return null;

  const submit=async(event:FormEvent)=>{
    event.preventDefault();setError('');
    if(!form.email.includes('@'))return setError('Enter a valid email address.');
    if(mode==='register'){
      if(form.name.trim().length<3)return setError('Enter your full name.');
      if(form.password.length<10||!/[A-Z]/.test(form.password)||!/[a-z]/.test(form.password)||!(/\d/.test(form.password))||!(/[^\w\s]/.test(form.password)))return setError('Use at least 10 characters with uppercase, lowercase, number, and symbol.');
      if(form.password!==form.confirmPassword)return setError('Passwords do not match.');
    }
    setSubmitting(true);
    try {
      const result=mode==='register'?await register(form.name,form.email,form.password):await login(form.email,form.password);
      if(!result.ok)return setError(result.message);
      notify({message:result.message,type:'success'});onClose();
    } catch {
      setError('The server did not respond. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="modal-backdrop" onMouseDown={onClose}><section className="auth-modal" onMouseDown={e=>e.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="auth-title"><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X/></button><div className="auth-head"><span className="eyebrow">{storeSettings.name.toUpperCase()}</span><h2 id="auth-title">{mode==='login'?'Welcome back':'Create your account'}</h2><p>{mode==='login'?'Sign in to continue shopping.':'Register to save your cart and orders.'}</p></div><form onSubmit={submit} className="form-stack">
    {mode==='register'&&<label>Full name<input required autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
    <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    <label>Password<div className="password-field"><input required type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
    {mode==='register'&&<label>Confirm password<input required type={showPassword?'text':'password'} autoComplete="new-password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})}/></label>}
    {error&&<p className="form-error" role="alert">{error}</p>}<button className="button primary full" type="submit" disabled={submitting}>{submitting?'Processing…':mode==='login'?'Sign in':'Create account'}</button>
  </form><button className="text-button" disabled={submitting} onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Need an account? Register':'Already registered? Sign in'}</button></section></div>;
}
