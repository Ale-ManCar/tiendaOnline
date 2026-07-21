import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmailAccount } from '../services/authService';

type VerificationState = 'loading' | 'success' | 'error';

export function EmailVerificationPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('Verificando tu correo...');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('El enlace de verificación no es válido.');
      return;
    }

    verifyEmailAccount(token)
      .then(() => {
        setState('success');
        setMessage('Tu correo fue verificado correctamente. Ya puedes iniciar sesión.');
      })
      .catch((error) => {
        setState('error');
        setMessage(error instanceof Error ? error.message : 'No pudimos verificar este correo.');
      });
  }, [params]);

  return (
    <section className="section">
      <div className="container">
        <div className="empty-state">
          {state === 'success' ? <CheckCircle2 size={42} /> : state === 'error' ? <XCircle size={42} /> : null}
          <span className="eyebrow">CUENTA</span>
          <h1>{state === 'loading' ? 'Verificando correo' : state === 'success' ? 'Correo verificado' : 'No se pudo verificar'}</h1>
          <p>{message}</p>
          <Link className="button primary" to="/">
            Volver a la tienda
          </Link>
        </div>
      </div>
    </section>
  );
}
