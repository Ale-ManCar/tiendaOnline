import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { requestPasswordReset } from '../services/authService';
import type { ToastState } from './Toast';

type AuthMode = 'login' | 'register' | 'forgot';

export function AuthModal({
  open,
  onClose,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  notify: (toast: ToastState) => void;
}) {
  const { login, register, storeSettings } = useStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.email.includes('@')) return setError('Ingresa un correo válido.');

    if (mode === 'forgot') {
      setSubmitting(true);
      try {
        await requestPasswordReset(form.email);
        notify({ message: 'Si el correo está registrado, enviaremos instrucciones para restablecer la contraseña.', type: 'success' });
        onClose();
      } catch {
        setError('No pudimos procesar la solicitud. Intenta nuevamente en unos minutos.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'register') {
      if (form.name.trim().length < 3) return setError('Ingresa tu nombre completo.');
      if (
        form.password.length < 10 ||
        !/[A-Z]/.test(form.password) ||
        !/[a-z]/.test(form.password) ||
        !/\d/.test(form.password) ||
        !/[^\w\s]/.test(form.password)
      ) {
        return setError('Usa al menos 10 caracteres con mayúscula, minúscula, número y símbolo.');
      }
      if (form.password !== form.confirmPassword) return setError('Las contraseñas no coinciden.');
    }

    setSubmitting(true);
    try {
      const result = mode === 'register' ? await register(form.name, form.email, form.password) : await login(form.email, form.password);
      if (!result.ok) return setError(result.message);
      notify({ message: result.message, type: 'success' });
      onClose();
    } catch {
      setError('No pudimos conectar con el servicio. Intenta nuevamente en unos minutos.');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="auth-modal" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="auth-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Cerrar">
          <X />
        </button>

        <div className="auth-head">
          <span className="eyebrow">{storeSettings.name.toUpperCase()}</span>
          <h2 id="auth-title">{mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña'}</h2>
          <p>
            {mode === 'login'
              ? 'Accede para consultar tus pedidos y continuar tu compra.'
              : mode === 'register'
                ? 'Regístrate para guardar tu carrito e historial de pedidos.'
                : 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.'}
          </p>
        </div>

        <form onSubmit={submit} className="form-stack">
          {mode === 'register' && (
            <label>
              Nombre completo
              <input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
          )}

          <label>
            Correo electrónico
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>

          {mode !== 'forgot' && (
            <label>
              Contraseña
              <div className="password-field">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}

          {mode === 'register' && (
            <label>
              Confirmar contraseña
              <input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              />
            </label>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="button primary full" type="submit" disabled={submitting}>
            {submitting ? 'Procesando…' : mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Crear cuenta' : 'Enviar enlace'}
          </button>
        </form>

        {mode === 'login' && (
          <button className="text-button" disabled={submitting} onClick={() => { setMode('forgot'); setError(''); }}>
            ¿Olvidaste tu contraseña?
          </button>
        )}

        <button className="text-button" disabled={submitting} onClick={switchMode}>
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </section>
    </div>
  );
}
