import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ProductImage } from './ProductImage';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, products, cartSubtotal, updateCartQuantity, removeFromCart, clearCart } = useStore();
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="cart-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <header><div><span className="eyebrow">TU COMPRA</span><h2>Carrito</h2></div><button className="icon-button" onClick={onClose}><X /></button></header>
        {cart.length === 0 ? (
          <div className="empty-state"><ShoppingCart size={48} /><h3>Tu carrito está vacío</h3><p>Explora el catálogo y agrega los productos que prefieras.</p><button className="button primary" onClick={() => { onClose(); navigate('/catalogo'); }}>Ver catálogo</button></div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => {
                const product = products.find((candidate) => candidate.id === item.productId);
                if (!product) return null;
                return (
                  <article className="cart-item" key={item.productId}>
                    <ProductImage src={product.image} alt={product.name} />
                    <div className="cart-item-info"><h4>{product.name}</h4><span>${product.price.toFixed(2)}</span>
                      <div className="quantity-control">
                        <button onClick={() => updateCartQuantity(product.id, item.quantity - 1)}><Minus size={14} /></button>
                        <strong>{item.quantity}</strong>
                        <button onClick={() => updateCartQuantity(product.id, item.quantity + 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                    <button className="remove-button" onClick={() => removeFromCart(product.id)} aria-label="Eliminar"><Trash2 size={18} /></button>
                  </article>
                );
              })}
            </div>
            <footer className="cart-footer">
              <button className="text-button danger" onClick={clearCart}>Vaciar carrito</button>
              <div className="cart-total-row"><span>Subtotal</span><strong>${cartSubtotal.toFixed(2)}</strong></div>
              <p>Los impuestos se calculan en el pago.</p>
              <button className="button primary full" onClick={() => { onClose(); navigate('/checkout'); }}>Continuar al pago</button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
