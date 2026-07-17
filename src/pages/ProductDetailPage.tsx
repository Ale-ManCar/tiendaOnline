import { Check, Minus, Plus, ShoppingBag, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import type { ToastState } from '../components/Toast';
import { useStore } from '../context/StoreContext';

type OutletContext = { notify: (toast: ToastState) => void };

export function ProductDetailPage() {
  const { id } = useParams();
  const { products, addToCart, catalogLoading, catalogError } = useStore();
  const { notify } = useOutletContext<OutletContext>();
  const [quantity, setQuantity] = useState(1);
  const product = products.find((candidate) => candidate.id === id && candidate.active);
  if (catalogLoading) return <div className="container not-found" role="status"><h1>Loading product…</h1></div>;
  if (catalogError) return <div className="container not-found" role="alert"><h1>Could not load product</h1><p>{catalogError}</p><Link className="button primary" to="/catalogo">Back to catalog</Link></div>;
  if (!product) return <div className="container not-found"><h1>Producto no encontrado</h1><Link className="button primary" to="/catalogo">Volver al catálogo</Link></div>;
  const related = products.filter((candidate) => candidate.active && candidate.category === product.category && candidate.id !== product.id).slice(0, 4);
  const add = (productId: string, qty = 1) => { const result = addToCart(productId, qty); notify({ message: result.message, type: result.ok ? 'success' : 'error' }); };

  return (
    <section className="section detail-page"><div className="container"><div className="breadcrumbs"><Link to="/">Inicio</Link><span>/</span><Link to="/catalogo">Catálogo</Link><span>/</span><span>{product.name}</span></div><div className="detail-grid"><div className="detail-image"><img src={product.image} alt={product.name} />{product.featured && <span className="product-badge">Destacado</span>}</div><div className="detail-content"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><div className="detail-price">${product.price.toFixed(2)}</div><p>{product.description}</p><div className="stock-row"><Check size={18} /> {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Producto agotado'}</div><div className="detail-buy"><div className="quantity-control large"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></button><strong>{quantity}</strong><button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><Plus /></button></div><button className="button primary" disabled={product.stock === 0} onClick={() => add(product.id, quantity)}><ShoppingBag size={18} /> Agregar al carrito</button></div><div className="detail-info"><div><Truck /><span><strong>Entrega confiable</strong><small>Seguimiento del pedido</small></span></div><div><Check /><span><strong>Compra segura</strong><small>Confirmación automática</small></span></div></div></div></div>{related.length > 0 && <div className="related"><div className="section-heading"><div><span className="eyebrow">TAMBIÉN PODRÍA GUSTARTE</span><h2>Productos relacionados</h2></div></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} onAdd={add} />)}</div></div>}</div></section>
  );
}
