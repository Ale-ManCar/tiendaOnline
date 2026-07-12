import {
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  LockKeyhole,
  PackageCheck,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import type { ToastState } from '../components/Toast';
import { useStore } from '../context/StoreContext';
import type { PaymentMethod, ShippingData } from '../types';

type OutletContext = { notify: (toast: ToastState) => void; openAuth: () => void };

export function CheckoutPage() {
  const { currentUser, cart, products, cartSubtotal, createOrder } = useStore();
  const { notify, openAuth } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentMethod>('Tarjeta');
  const [error, setError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [shipping, setShipping] = useState<ShippingData>({
    fullName: currentUser?.name ?? '',
    email: currentUser?.email ?? '',
    phone: '',
    province: 'Guayas',
    city: 'Guayaquil',
    address: '',
    notes: '',
  });
  const tax = useMemo(() => Number((cartSubtotal * 0.15).toFixed(2)), [cartSubtotal]);
  const total = cartSubtotal + tax;

  if (cart.length === 0) return <Navigate to="/catalogo" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (placingOrder) return;
    if (!currentUser) {
      openAuth();
      setError('You need to sign in before placing an order.');
      return;
    }
    if (
      !shipping.fullName ||
      !shipping.email ||
      !shipping.phone ||
      !shipping.province ||
      !shipping.city ||
      !shipping.address
    ) {
      setError('Complete all required delivery fields.');
      return;
    }
    setPlacingOrder(true);
    try {
      const order = await createOrder(shipping, payment);
      notify({ message: 'Order registered successfully.', type: 'success' });
      navigate(`/confirmacion/${order.id}`);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'The order could not be completed.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <section className="section checkout-page">
      <div className="container">
        <Link className="back-link" to="/catalogo">
          <ChevronLeft size={17} /> Continue shopping
        </Link>
        <div className="page-intro compact">
          <span className="eyebrow">CHECKOUT</span>
          <h1>Delivery information</h1>
        </div>
        <form className="checkout-grid" onSubmit={submit}>
          <div className="checkout-form">
            <section className="form-card">
              <div className="form-card-title">
                <span>1</span>
                <div>
                  <h3>Customer details</h3>
                  <p>Information used to create the order.</p>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Full name *
                  <input
                    value={shipping.fullName}
                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                  />
                </label>
                <label>
                  Email *
                  <input
                    type="email"
                    value={shipping.email}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                  />
                </label>
                <label>
                  Phone *
                  <input
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    placeholder="099 000 0000"
                  />
                </label>
                <label>
                  Province *
                  <input
                    value={shipping.province}
                    onChange={(e) => setShipping({ ...shipping, province: e.target.value })}
                  />
                </label>
                <label>
                  City *
                  <input
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  />
                </label>
                <label className="full-span">
                  Address *
                  <input
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                    placeholder="Street, number, delivery reference"
                  />
                </label>
                <label className="full-span">
                  Order notes
                  <textarea
                    value={shipping.notes}
                    onChange={(e) => setShipping({ ...shipping, notes: e.target.value })}
                    placeholder="Additional delivery information"
                  />
                </label>
              </div>
            </section>
            <section className="form-card">
              <div className="form-card-title">
                <span>2</span>
                <div>
                  <h3>Payment method</h3>
                  <p>The order is registered on the server before payment automation.</p>
                </div>
              </div>
              <div className="payment-options">
                {(['Tarjeta', 'Transferencia', 'Contra entrega'] as PaymentMethod[]).map((method) => (
                  <label className={payment === method ? 'payment-option selected' : 'payment-option'} key={method}>
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === method}
                      onChange={() => setPayment(method)}
                    />
                    {method === 'Tarjeta' ? <CreditCard /> : method === 'Transferencia' ? <LockKeyhole /> : <PackageCheck />}
                    <span>
                      <strong>{method}</strong>
                      <small>
                        {method === 'Tarjeta'
                          ? 'Card payment placeholder'
                          : method === 'Transferencia'
                            ? 'Manual bank transfer review'
                            : 'Pay when the order is delivered'}
                      </small>
                    </span>
                    {payment === method && <CheckCircle2 className="payment-check" />}
                  </label>
                ))}
              </div>
              {payment === 'Tarjeta' && (
                <div className="demo-card-fields">
                  <label>
                    Card number
                    <input placeholder="4242 4242 4242 4242" />
                  </label>
                  <label>
                    Expiration
                    <input placeholder="MM/YY" />
                  </label>
                  <label>
                    CVV
                    <input placeholder="123" />
                  </label>
                </div>
              )}
            </section>
            {error && <p className="form-error prominent">{error}</p>}
          </div>
          <aside className="order-summary">
            <h3>Order summary</h3>
            <div className="summary-items">
              {cart.map((item) => {
                const product = products.find((candidate) => candidate.id === item.productId);
                return product ? (
                  <div key={item.productId}>
                    <img src={product.image} alt={product.name} />
                    <span>
                      <strong>{product.name}</strong>
                      <small>Quantity: {item.quantity}</small>
                    </span>
                    <b>${(product.price * item.quantity).toFixed(2)}</b>
                  </div>
                ) : null;
              })}
            </div>
            <div className="summary-totals">
              <div>
                <span>Subtotal</span>
                <strong>${cartSubtotal.toFixed(2)}</strong>
              </div>
              <div>
                <span>VAT (15%)</span>
                <strong>${tax.toFixed(2)}</strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>
            </div>
            <button className="button primary full" type="submit" disabled={placingOrder}>
              {placingOrder ? 'Registering order...' : 'Place order'}
            </button>
            <p className="secure-note">
              <LockKeyhole size={15} /> Prices and stock are verified on the server.
            </p>
          </aside>
        </form>
      </div>
    </section>
  );
}
