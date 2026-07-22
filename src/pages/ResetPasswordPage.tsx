import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { resetPasswordAccount } from '../services/authService';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const completed = Boolean(message);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!token) return setError('El enlace de recuperación no es válido.');
    if (
      password.length < 10 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^\w\s]/.test(password)
    ) {
      return setError('Usa al menos 10 caracteres con mayúscula, minúscula, número y símbolo.');
    }
    if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');

    setSubmitting(true);
    try {
      await resetPasswordAccount(token, password);
      setMessage('Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No pudimos actualizar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="empty-state auth-panel">
          <span className="eyebrow">CUENTA</span>
          <h1>Restablecer contraseña</h1>
          <p>{completed ? message : 'Crea una nueva contraseña segura para tu cuenta.'}</p>

          {!completed && (
            <form className="form-stack reset-password-form" onSubmit={submit}>
              <label>
                Nueva contraseña
                <div className="password-field">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label>
                Confirmar contraseña
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button className="button primary full" type="submit" disabled={submitting}>
                {submitting ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </form>
          )}

          <Link className="button secondary" to="/">
            Volver a la tienda
          </Link>
        </div>
      </div>
    </section>
  );
}
