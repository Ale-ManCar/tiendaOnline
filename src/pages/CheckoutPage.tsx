import { CheckCircle2, ChevronLeft, CreditCard, LockKeyhole, PackageCheck, Truck } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import type { ToastState } from '../components/Toast';
import { useStore } from '../context/StoreContext';
import type { PaymentMethod, ShippingData } from '../types';
import { storeConfig } from '../config/storeConfig';

type OutletContext = { notify: (toast: ToastState) => void; openAuth: () => void };

export function CheckoutPage() {
  const { currentUser, cart, products, cartSubtotal, createOrder, storeSettings } = useStore();
  const { notify, openAuth } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentMethod>('Transferencia');
  const [paymentReference, setPaymentReference] = useState('');
  const [error, setError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [shipping, setShipping] = useState<ShippingData>({
    fullName: currentUser?.name ?? '',
    email: currentUser?.email ?? '',
    phone: '',
    province: 'Guayas',
    city: storeSettings.defaultCheckoutCity,
    address: '',
    notes: '',
  });
  const tax = useMemo(() => Number((cartSubtotal * 0.15).toFixed(2)), [cartSubtotal]);
  const shippingCost = useMemo(
    () => (storeSettings.freeShippingThreshold > 0 && cartSubtotal >= storeSettings.freeShippingThreshold ? 0 : storeSettings.shippingFlatRate),
    [cartSubtotal, storeSettings.freeShippingThreshold, storeSettings.shippingFlatRate],
  );
  const total = cartSubtotal + tax + shippingCost;
  const remainingForFreeShipping = Math.max(0, storeSettings.freeShippingThreshold - cartSubtotal);
  const paymentOptions = useMemo(() => {
    const configured = [
      storeConfig.enableBankTransfer && {
        method: 'Transferencia' as PaymentMethod,
        icon: <LockKeyhole />,
        description: 'Validación manual con comprobante o referencia.',
        instructions: storeSettings.bankTransferInstructions,
      },
      storeConfig.enableCashOnDelivery && {
        method: 'Contra entrega' as PaymentMethod,
        icon: <PackageCheck />,
        description: 'Pago al recibir el pedido.',
        instructions: storeSettings.cashOnDeliveryInstructions,
      },
      storeConfig.enableCardPayments && {
        method: 'Tarjeta' as PaymentMethod,
        icon: <CreditCard />,
        description: 'Pago con proveedor conectado.',
        instructions: storeConfig.cardPaymentInstructions,
      },
    ].filter(Boolean) as Array<{ method: PaymentMethod; icon: ReactNode; description: string; instructions: string }>;

    return configured.length
      ? configured
      : [
          {
            method: 'Transferencia' as PaymentMethod,
            icon: <LockKeyhole />,
            description: 'Validación manual con comprobante o referencia.',
            instructions: storeSettings.bankTransferInstructions,
          },
        ];
  }, [storeSettings.bankTransferInstructions, storeSettings.cashOnDeliveryInstructions]);
  const selectedPayment = paymentOptions.find((option) => option.method === payment) ?? paymentOptions[0];

  useEffect(() => {
    if (selectedPayment && selectedPayment.method !== payment) setPayment(selectedPayment.method);
  }, [payment, selectedPayment]);

  if (cart.length === 0) return <Navigate to="/catalogo" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (placingOrder) return;
    if (!currentUser) {
      openAuth();
      setError('Debes iniciar sesión antes de realizar el pedido.');
      return;
    }
    if (!shipping.fullName || !shipping.email || !shipping.phone || !shipping.province || !shipping.city || !shipping.address) {
      setError('Completa todos los campos obligatorios de entrega.');
      return;
    }
    if (payment === 'Transferencia' && paymentReference.trim().length < 3) {
      setError('Ingresa la referencia o número de comprobante de la transferencia.');
      return;
    }
    setPlacingOrder(true);
    try {
      const order = await createOrder(shipping, payment, paymentReference.trim());
      notify({ message: 'Pedido registrado correctamente.', type: 'success' });
      navigate(`/confirmacion/${order.id}`);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo completar el pedido.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <section className="section checkout-page">
      <div className="container">
        <Link className="back-link" to="/catalogo">
          <ChevronLeft size={17} /> Seguir comprando
        </Link>
        <div className="page-intro compact">
          <span className="eyebrow">CHECKOUT</span>
          <h1>Información de entrega</h1>
        </div>
        <form className="checkout-grid" onSubmit={submit}>
          <div className="checkout-form">
            <section className="form-card">
              <div className="form-card-title">
                <span>1</span>
                <div>
                  <h3>Datos del cliente</h3>
                  <p>Información necesaria para crear y coordinar el pedido.</p>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Nombre completo *
                  <input value={shipping.fullName} onChange={(event) => setShipping({ ...shipping, fullName: event.target.value })} />
                </label>
                <label>
                  Email *
                  <input type="email" value={shipping.email} onChange={(event) => setShipping({ ...shipping, email: event.target.value })} />
                </label>
                <label>
                  Teléfono *
                  <input value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} placeholder="099 000 0000" />
                </label>
                <label>
                  Provincia *
                  <input value={shipping.province} onChange={(event) => setShipping({ ...shipping, province: event.target.value })} />
                </label>
                <label>
                  Ciudad *
                  <input value={shipping.city} onChange={(event) => setShipping({ ...shipping, city: event.target.value })} />
                </label>
                <label className="full-span">
                  Dirección *
                  <input
                    value={shipping.address}
                    onChange={(event) => setShipping({ ...shipping, address: event.target.value })}
                    placeholder="Calle, número y referencia de entrega"
                  />
                </label>
                <label className="full-span">
                  Notas del pedido
                  <textarea
                    value={shipping.notes}
                    onChange={(event) => setShipping({ ...shipping, notes: event.target.value })}
                    placeholder="Información adicional para la entrega"
                  />
                </label>
              </div>
            </section>

            <section className="form-card">
              <div className="form-card-title">
                <span>2</span>
                <div>
                  <h3>Entrega</h3>
                  <p>El costo de envío se calcula según el total del carrito.</p>
                </div>
              </div>
              <div className="shipping-rule-card">
                <Truck size={22} />
                <span>
                  <strong>{shippingCost === 0 ? 'Envío gratis aplicado' : `Envío: $${shippingCost.toFixed(2)}`}</strong>
                  <small>
                    {shippingCost === 0
                      ? `Tu compra supera el mínimo de $${storeSettings.freeShippingThreshold.toFixed(2)}.`
                      : `Agrega $${remainingForFreeShipping.toFixed(2)} para envío gratis.`}
                  </small>
                  <small>{storeSettings.shippingCoverageNote}</small>
                </span>
              </div>
            </section>

            <section className="form-card">
              <div className="form-card-title">
                <span>3</span>
                <div>
                  <h3>Método de pago</h3>
                  <p>Elige cómo el cliente pagará este pedido.</p>
                </div>
              </div>
              <div className="payment-options">
                {paymentOptions.map(({ method, icon, description }) => (
                  <label className={payment === method ? 'payment-option selected' : 'payment-option'} key={method}>
                    <input type="radio" name="payment" checked={payment === method} onChange={() => setPayment(method)} />
                    {icon}
                    <span>
                      <strong>{method}</strong>
                      <small>{description}</small>
                    </span>
                    {payment === method && <CheckCircle2 className="payment-check" />}
                  </label>
                ))}
              </div>
              {selectedPayment && (
                <div className="payment-instructions">
                  <strong>{selectedPayment.method === 'Transferencia' ? storeSettings.bankAccountLabel : selectedPayment.method}</strong>
                  <p>{selectedPayment.instructions}</p>
                </div>
              )}
              {payment === 'Transferencia' && (
                <div className="payment-reference">
                  <label>
                    Referencia de transferencia *
                    <input
                      value={paymentReference}
                      onChange={(event) => setPaymentReference(event.target.value)}
                      placeholder="Número de comprobante, transacción o nota"
                    />
                  </label>
                </div>
              )}
            </section>
            {error && <p className="form-error prominent">{error}</p>}
          </div>
          <aside className="order-summary">
            <h3>Resumen del pedido</h3>
            <div className="summary-items">
              {cart.map((item) => {
                const product = products.find((candidate) => candidate.id === item.productId);
                return product ? (
                  <div key={item.productId}>
                    <ProductImage src={product.image} alt={product.name} />
                    <span>
                      <strong>{product.name}</strong>
                      <small>Cantidad: {item.quantity}</small>
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
                <span>IVA (15%)</span>
                <strong>${tax.toFixed(2)}</strong>
              </div>
              <div>
                <span>Envío</span>
                <strong>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}</strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>
            </div>
            <button className="button primary full" type="submit" disabled={placingOrder}>
              {placingOrder ? 'Registrando pedido...' : 'Realizar pedido'}
            </button>
            <p className="secure-note">
              <LockKeyhole size={15} /> Precios, stock y envío se validan antes de registrar el pedido.
            </p>
          </aside>
        </form>
      </div>
    </section>
  );
}
