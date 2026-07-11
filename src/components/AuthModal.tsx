import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { ToastState } from './Toast';

export function AuthModal({ open, onClose, notify }: { open: boolean; onClose: () => void; notify: (toast: ToastState) => void }) {
  const { login, register } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.email.includes('@')) return setError('Ingresa un correo válido.');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (mode === 'register') {
      if (form.name.trim().length < 3) return setError('Ingresa tu nombre completo.');
      if (form.password !== form.confirmPassword) return setError('Las contraseñas no coinciden.');
      const result = register(form.name, form.email, form.password);
      if (!result.ok) return setError(result.message);
      notify({ message: result.message, type: 'success' });
      onClose();
      return;
    }
    const result = login(form.email, form.password);
    if (!result.ok) return setError(result.message);
    notify({ message: result.message, type: 'success' });
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="auth-modal" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Cerrar"><X /></button>
        <div className="auth-head">
          <span className="eyebrow">NOVA STORE</span>
          <h2>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h2>
          <p>{mode === 'login' ? 'Ingresa para continuar con tus compras.' : 'Regístrate y guarda tu historial de pedidos.'}</p>
        </div>
        <form onSubmit={handleSubmit} className="form-stack">
          {mode === 'register' && (
            <label>Nombre completo<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alejandro Mantilla" /></label>
          )}
          <label>Correo electrónico<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" /></label>
          <label>Contraseña
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar contraseña">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          {mode === 'register' && (
            <label>Confirmar contraseña<input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="button primary full" type="submit">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</button>
        </form>
        {mode === 'login' && <div className="demo-box"><strong>Acceso administrador</strong><span>admin@tienda.com · Admin123*</span></div>}
        <button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </section>
    </div>
  );
}
