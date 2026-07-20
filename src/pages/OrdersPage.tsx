import { PackageOpen } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatMoney, formatShippingCost, getOrderShipping } from '../utils/orderDisplay';

export function OrdersPage() {
  const { currentUser, orders } = useStore();

  if (!currentUser) return <Navigate to="/" replace />;

  const userOrders = orders.filter((order) => order.userId === currentUser.id);

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
                        <img src={item.image} alt={item.name} />
                        <span>
                          <strong>{item.name}</strong>
                          <small>
                            {item.quantity} × {formatMoney(item.price)}
                          </small>
                        </span>
                      </div>
                    ))}
                  </div>

                  <footer>
                    <span>
                      <strong>Pago:</strong> {order.paymentMethod}
                      {order.paymentReference ? ` · Ref: ${order.paymentReference}` : ''}
                    </span>
                    <span>
                      <strong>Envío:</strong> {formatShippingCost(order.shippingCost)} · {shipping.address}, {shipping.city}
                    </span>
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
