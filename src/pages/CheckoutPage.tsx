import { CheckCircle2, ChevronLeft, CreditCard, LockKeyhole, PackageCheck } from 'lucide-react';
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
  const [shipping, setShipping] = useState<ShippingData>({ fullName: currentUser?.name ?? '', email: currentUser?.email ?? '', phone: '', address: '', city: 'Guayaquil', notes: '' });
  const tax = useMemo(() => Number((cartSubtotal * 0.15).toFixed(2)), [cartSubtotal]);
  const total = cartSubtotal + tax;

  if (cart.length === 0) return <Navigate to="/catalogo" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!currentUser) { openAuth(); setError('Debes iniciar sesión para finalizar la compra.'); return; }
    if (!shipping.fullName || !shipping.email || !shipping.phone || !shipping.address || !shipping.city) { setError('Completa todos los campos obligatorios.'); return; }
    try {
      const order = createOrder(shipping, payment);
      notify({ message: 'Compra registrada correctamente.', type: 'success' });
      navigate(`/confirmacion/${order.id}`);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo completar la compra.');
    }
  };

  return (
    <section className="section checkout-page"><div className="container"><Link className="back-link" to="/catalogo"><ChevronLeft size={17} /> Seguir comprando</Link><div className="page-intro compact"><span className="eyebrow">FINALIZAR COMPRA</span><h1>Información de entrega</h1></div><form className="checkout-grid" onSubmit={submit}><div className="checkout-form"><section className="form-card"><div className="form-card-title"><span>1</span><div><h3>Datos del cliente</h3><p>Información para confirmar el pedido.</p></div></div><div className="form-grid"><label>Nombre completo *<input value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} /></label><label>Correo electrónico *<input type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} /></label><label>Teléfono *<input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} placeholder="099 000 0000" /></label><label>Ciudad *<input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} /></label><label className="full-span">Dirección *<input value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} placeholder="Calle, número, referencia" /></label><label className="full-span">Notas del pedido<textarea value={shipping.notes} onChange={(e) => setShipping({ ...shipping, notes: e.target.value })} placeholder="Información adicional para la entrega" /></label></div></section><section className="form-card"><div className="form-card-title"><span>2</span><div><h3>Método de pago</h3><p>Selecciona una opción para la simulación.</p></div></div><div className="payment-options">{(['Tarjeta', 'Transferencia', 'Contra entrega'] as PaymentMethod[]).map((method) => <label className={payment === method ? 'payment-option selected' : 'payment-option'} key={method}><input type="radio" name="payment" checked={payment === method} onChange={() => setPayment(method)} />{method === 'Tarjeta' ? <CreditCard /> : method === 'Transferencia' ? <LockKeyhole /> : <PackageCheck />}<span><strong>{method}</strong><small>{method === 'Tarjeta' ? 'Pago simulado con tarjeta' : method === 'Transferencia' ? 'Comprobante bancario simulado' : 'Paga cuando recibas el pedido'}</small></span>{payment === method && <CheckCircle2 className="payment-check" />}</label>)}</div>{payment === 'Tarjeta' && <div className="demo-card-fields"><label>Número de tarjeta<input placeholder="4242 4242 4242 4242" /></label><label>Vencimiento<input placeholder="MM/AA" /></label><label>CVV<input placeholder="123" /></label></div>}</section>{error && <p className="form-error prominent">{error}</p>}</div><aside className="order-summary"><h3>Resumen del pedido</h3><div className="summary-items">{cart.map((item) => { const product = products.find((candidate) => candidate.id === item.productId); return product ? <div key={item.productId}><img src={product.image} alt={product.name} /><span><strong>{product.name}</strong><small>Cantidad: {item.quantity}</small></span><b>${(product.price * item.quantity).toFixed(2)}</b></div> : null; })}</div><div className="summary-totals"><div><span>Subtotal</span><strong>${cartSubtotal.toFixed(2)}</strong></div><div><span>IVA (15%)</span><strong>${tax.toFixed(2)}</strong></div><div className="summary-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div></div><button className="button primary full" type="submit">Confirmar compra</button><p className="secure-note"><LockKeyhole size={15} /> Esta es una simulación académica de pago.</p></aside></form></div></section>
  );
}
