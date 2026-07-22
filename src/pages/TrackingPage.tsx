import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PackageSearch, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { fetchTrackedOrder } from '../services/orderService';
import type { Order, OrderStatus } from '../types';
import { formatMoney, formatShippingCost, getOrderShipping } from '../utils/orderDisplay';

const statusSteps: OrderStatus[] = ['Pendiente', 'Procesando', 'Enviado', 'Entregado'];

export function TrackingPage() {
  const { orders, products } = useStore();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('codigo') ?? '';
  const [query, setQuery] = useState(initialCode);
  const [submittedCode, setSubmittedCode] = useState(initialCode);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  const localOrder = useMemo(() => {
    const normalizedCode = submittedCode.trim().toLowerCase();
    if (!normalizedCode) return null;
    return orders.find((candidate) => candidate.id.toLowerCase() === normalizedCode) ?? null;
  }, [orders, submittedCode]);

  useEffect(() => {
    const code = submittedCode.trim();
    if (!code || localOrder) {
      setTrackedOrder(null);
      setTrackingLoading(false);
      setTrackingError('');
      return;
    }

    let active = true;
    setTrackingLoading(true);
    setTrackingError('');
    fetchTrackedOrder(code, products)
      .then((order) => {
        if (active) setTrackedOrder(order);
      })
      .catch((error) => {
        if (!active) return;
        setTrackedOrder(null);
        setTrackingError(error instanceof Error ? error.message : 'No se pudo consultar el pedido.');
      })
      .finally(() => {
        if (active) setTrackingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [localOrder, products, submittedCode]);

  const order = localOrder ?? trackedOrder;
  const hasSearched = submittedCode.trim().length > 0;
  const shipping = order ? getOrderShipping(order) : null;
  const currentStep = order ? Math.max(0, statusSteps.indexOf(order.status)) : -1;
  const history = order?.statusHistory?.length ? order.statusHistory : order ? [{ status: order.status, date: order.createdAt }] : [];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedCode(query);
  };

  return (
    <section className="section tracking-page">
      <div className="container">
        <div className="tracking-hero">
          <span className="eyebrow">SEGUIMIENTO</span>
          <h1>Rastrea tu pedido</h1>
          <p>Ingresa el código de compra para consultar el estado, el pago y los datos principales de entrega.</p>
        </div>

        <form className="tracking-search" onSubmit={submit}>
          <label>
            Código de pedido
            <span>
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej: NV-E4992EOAE768" />
            </span>
          </label>
          <button className="button primary" type="submit">
            Consultar
          </button>
        </form>

        {!hasSearched && (
          <div className="tracking-empty">
            <PackageSearch />
            <h2>Ten a mano tu código de pedido</h2>
            <p>Lo encuentras en la pantalla de confirmación o en “Mis pedidos” si compraste con una cuenta.</p>
          </div>
        )}

        {trackingLoading && (
          <div className="tracking-empty">
            <PackageSearch />
            <h2>Consultando pedido</h2>
            <p>Estamos buscando el estado actualizado en el sistema.</p>
          </div>
        )}

        {hasSearched && !trackingLoading && !order && (
          <div className="tracking-empty error">
            <PackageSearch />
            <h2>No encontramos ese pedido</h2>
            <p>{trackingError || 'Revisa que el código esté escrito exactamente igual o inicia sesión con la cuenta usada para comprar.'}</p>
            <Link className="button secondary" to="/catalogo">
              Volver al catálogo
            </Link>
          </div>
        )}

        {order && shipping && (
          <div className="tracking-result">
            <div className="tracking-summary">
              <div>
                <span className="eyebrow">PEDIDO</span>
                <h2>{order.id}</h2>
                <p>{formatDate(order.createdAt)}</p>
              </div>
              <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
            </div>

            <ol className="tracking-steps">
              {statusSteps.map((status, index) => (
                <li className={index <= currentStep ? 'complete' : ''} key={status}>
                  <span>{index + 1}</span>
                  <strong>{status}</strong>
                </li>
              ))}
            </ol>

            <div className="tracking-grid">
              <article>
                <h3>Entrega</h3>
                <p>{shipping.fullName}</p>
                <p>
                  {shipping.city}, {shipping.province}
                </p>
                <p>{shipping.address}</p>
              </article>

              <article>
                <h3>Pago</h3>
                <p>{order.paymentMethod}</p>
                {order.paymentReference && <p>Referencia: {order.paymentReference}</p>}
                <p>Total: {formatMoney(order.total)}</p>
              </article>

              <article>
                <h3>Resumen</h3>
                <p>Subtotal: {formatMoney(order.subtotal)}</p>
                <p>IVA 15%: {formatMoney(order.tax)}</p>
                <p>Envío: {formatShippingCost(order.shippingCost)}</p>
              </article>
            </div>

            <article className="tracking-history">
              <h3>Historial del pedido</h3>
              <ol>
                {history.map((entry, index) => (
                  <li key={`${entry.status}-${entry.date}-${index}`}>
                    <strong>{entry.status}</strong>
                    <small>{formatDate(entry.date)}</small>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(value?: string) {
  if (!value) return 'Fecha no registrada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no registrada';
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
}
