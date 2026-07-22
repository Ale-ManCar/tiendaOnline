import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { changePasswordAccount } from '../services/authService';
import type { ToastState } from './Toast';

export function ChangePasswordModal({
  open,
  onClose,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  notify: (toast: ToastState) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (
      newPassword.length < 10 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[^\w\s]/.test(newPassword)
    ) {
      return setError('Usa al menos 10 caracteres con mayúscula, minúscula, número y símbolo.');
    }
    if (currentPassword === newPassword) return setError('La nueva contraseña debe ser diferente a la actual.');
    if (newPassword !== confirmPassword) return setError('Las contraseñas no coinciden.');

    setSubmitting(true);
    try {
      await changePasswordAccount(currentPassword, newPassword);
      notify({ message: 'Contraseña actualizada. Te enviaremos una confirmación por correo.', type: 'success' });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No pudimos actualizar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="auth-modal" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="change-password-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Cerrar">
          <X />
        </button>
        <div className="auth-head">
          <span className="eyebrow">SEGURIDAD</span>
          <h2 id="change-password-title">Cambiar contraseña</h2>
          <p>Actualiza tu contraseña. Te enviaremos una notificación al correo registrado.</p>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label>
            Contraseña actual
            <PasswordField value={currentPassword} onChange={setCurrentPassword} show={showPassword} autoComplete="current-password" />
          </label>
          <label>
            Nueva contraseña
            <PasswordField value={newPassword} onChange={setNewPassword} show={showPassword} autoComplete="new-password" />
          </label>
          <label>
            Confirmar nueva contraseña
            <input
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          <button className="text-button" type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} {showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
          </button>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="button primary full" type="submit" disabled={submitting}>
            {submitting ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </form>
      </section>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  autoComplete: string;
}) {
  return (
    <input
      required
      type={show ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
