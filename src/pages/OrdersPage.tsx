import { MessageCircle, PackageOpen } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import { formatMoney, formatShippingCost, getOrderShipping } from '../utils/orderDisplay';
import type { OrderStatus } from '../types';

const statusSteps: OrderStatus[] = ['Pendiente', 'Procesando', 'Enviado', 'Entregado'];

export function OrdersPage() {
  const { currentUser, orders, storeSettings } = useStore();

  if (!currentUser) return <Navigate to="/" replace />;

  const userOrders = orders.filter((order) => order.userId === currentUser.id);
  const supportPhoneDigits = storeSettings.supportPhone.replace(/\D/g, '');
  const whatsappPhone = supportPhoneDigits.startsWith('593') ? supportPhoneDigits : supportPhoneDigits.replace(/^0/, '593');

  return (
    <section className="section orders-page">
      <div className="container">
        <div className="page-intro">
          <span className="eyebrow">MI CUENTA</span>
          <h1>Historial de pedidos</h1>
          <p>Consulta las compras realizadas y su estado actual.</p>
        </div>

        {userOrders.length === 0 ? (
          <div className="empty-state boxed">
            <PackageOpen size={48} />
            <h3>Aún no tienes pedidos</h3>
            <p>Cuando completes una compra aparecerá en esta sección.</p>
            <Link className="button primary" to="/catalogo">
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {userOrders.map((order) => {
              const shipping = getOrderShipping(order);
              const whatsappMessage = encodeURIComponent(
                `Hola, quisiera consultar sobre mi pedido ${order.id}.\nNombre: ${shipping.fullName}\nTotal: ${formatMoney(order.total)}\nEstado: ${order.status}`,
              );
              const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}` : '';

              return (
                <article className="order-card" key={order.id}>
                  <header>
                    <div>
                      <span>Pedido</span>
                      <strong>{order.id}</strong>
                    </div>
                    <div>
                      <span>Fecha</span>
                      <strong>{new Date(order.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>{formatMoney(order.total)}</strong>
                    </div>
                    <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
                  </header>

                  <div className="order-products">
                    {order.items.map((item) => (
                      <div key={item.productId}>
                        <ProductImage src={item.image} alt={item.name} />
                        <span>
                          <strong>{item.name}</strong>
                          <small>
                            {item.quantity} × {formatMoney(item.price)}
                          </small>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="customer-order-details">
                    <article>
                      <span>Entrega</span>
                      <strong>{shipping.city}, {shipping.province}</strong>
                      <p>{shipping.address}</p>
                    </article>
                    <article>
                      <span>Pago</span>
                      <strong>{order.paymentMethod}</strong>
                      <p>{order.paymentReference ? `Referencia: ${order.paymentReference}` : 'Sin referencia registrada'}</p>
                    </article>
                    <article>
                      <span>Resumen</span>
                      <strong>{formatMoney(order.total)}</strong>
                      <p>IVA {formatMoney(order.tax)} · Envío {formatShippingCost(order.shippingCost)}</p>
                    </article>
                  </div>

                  <ol className="customer-status-timeline">
                    {statusSteps.map((status) => {
                      const activeIndex = statusSteps.indexOf(order.status);
                      const stepIndex = statusSteps.indexOf(status);
                      const historyEntry = order.statusHistory?.find((entry) => entry.status === status);

                      return (
                        <li key={status} className={stepIndex <= activeIndex ? 'complete' : ''}>
                          <span>{stepIndex + 1}</span>
                          <strong>{status}</strong>
                          <small>{historyEntry ? new Date(historyEntry.date).toLocaleDateString('es-EC') : 'Pendiente'}</small>
                        </li>
                      );
                    })}
                  </ol>

                  <footer>
                    <div>
                      <span>
                        <strong>Pago:</strong> {order.paymentMethod}
                        {order.paymentReference ? ` · Ref: ${order.paymentReference}` : ''}
                      </span>
                      <span>
                        <strong>Envío:</strong> {formatShippingCost(order.shippingCost)} · {shipping.address}, {shipping.city}
                      </span>
                    </div>
                    <div className="order-card-actions">
                      {whatsappUrl && (
                        <a className="button secondary small" href={whatsappUrl} target="_blank" rel="noreferrer">
                          <MessageCircle size={15} /> WhatsApp
                        </a>
                      )}
                      <Link className="button secondary small" to={`/rastreo?codigo=${encodeURIComponent(order.id)}`}>
                        Rastrear pedido
                      </Link>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
