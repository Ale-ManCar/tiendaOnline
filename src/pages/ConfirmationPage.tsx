import { CheckCircle2, MessageCircle, Package, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatMoney, formatShippingCost, getOrderShipping } from '../utils/orderDisplay';

export function ConfirmationPage() {
  const { id } = useParams();
  const { orders, currentUser, storeSettings } = useStore();
  const order = orders.find((candidate) => candidate.id === id);

  if (!order || (currentUser?.role !== 'admin' && order.userId !== currentUser?.id)) {
    return (
      <div className="container not-found">
        <h1>Pedido no encontrado</h1>
        <Link className="button primary" to="/">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const shipping = getOrderShipping(order);
  const supportPhoneDigits = storeSettings.supportPhone.replace(/\D/g, '');
  const whatsappPhone = supportPhoneDigits.startsWith('593') ? supportPhoneDigits : supportPhoneDigits.replace(/^0/, '593');
  const whatsappMessage = encodeURIComponent(
    `Hola, quisiera consultar sobre mi pedido ${order.id}.\nNombre: ${shipping.fullName}\nTotal: ${formatMoney(order.total)}\nEstado: ${order.status}`,
  );
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}` : '';

  return (
    <section className="section confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          <CheckCircle2 className="confirmation-icon" />
          <span className="eyebrow">COMPRA CONFIRMADA</span>
          <h1>Gracias por tu pedido</h1>
          <p>Recibimos tu compra y la registramos correctamente.</p>

          <div className="order-code">
            <span>Código de pedido</span>
            <strong>{order.id}</strong>
          </div>

          <div className="confirmation-grid">
            <div>
              <Package />
              <span>
                <small>Estado</small>
                <strong>{order.status}</strong>
              </span>
            </div>
            <div>
              <ShoppingBag />
              <span>
                <small>Total</small>
                <strong>{formatMoney(order.total)}</strong>
              </span>
            </div>
          </div>

          <div className="confirmation-details">
            <h3>Entrega</h3>
            <p>{shipping.fullName}</p>
            <p>
              {shipping.address}, {shipping.city}
            </p>
            <p>
              {shipping.email} · {shipping.phone}
            </p>
            <p>Envío: {formatShippingCost(order.shippingCost)}</p>

            <h3>Pago</h3>
            <p>{order.paymentMethod}</p>
            {order.paymentReference && <p>Referencia: {order.paymentReference}</p>}
          </div>

          <div className="confirmation-actions">
            {whatsappUrl && (
              <a className="button secondary" href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> Consultar por WhatsApp
              </a>
            )}
            <Link className="button primary" to="/pedidos">
              Ver mis pedidos
            </Link>
            <Link className="button secondary" to={`/rastreo?codigo=${encodeURIComponent(order.id)}`}>
              Rastrear pedido
            </Link>
            <Link className="button secondary" to="/catalogo">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
