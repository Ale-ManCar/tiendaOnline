import { ArrowRight, Headphones, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import type { ToastState } from '../components/Toast';

type OutletContext = { notify: (toast: ToastState) => void };

export function HomePage() {
  const { products, addToCart } = useStore();
  const { notify } = useOutletContext<OutletContext>();
  const featured = products.filter((product) => product.active && product.featured).slice(0, 6);
  const categories = [
    { name: 'Tecnología', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80' },
    { name: 'Hogar', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80' },
    { name: 'Moda', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80' },
  ];

  const handleAdd = (id: string) => {
    const result = addToCart(id);
    notify({ message: result.message, type: result.ok ? 'success' : 'error' });
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy"><span className="eyebrow">NUEVA COLECCIÓN 2026</span><h1>Diseño que encaja con tu forma de vivir.</h1><p>Descubre tecnología, hogar, moda y bienestar seleccionados para tu día a día.</p><div className="hero-actions"><Link className="button primary" to="/catalogo">Explorar catálogo <ArrowRight size={18} /></Link><a className="button secondary" href="#destacados">Ver destacados</a></div><div className="hero-stats"><div><strong>+12</strong><span>productos</span></div><div><strong>24/7</strong><span>disponibilidad</span></div><div><strong>100%</strong><span>responsive</span></div></div></div>
          <div className="hero-visual"><img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85" alt="Sala moderna con productos de diseño" /><div className="floating-card"><span>Oferta destacada</span><strong>Hasta 20% de descuento</strong><Link to="/catalogo">Comprar ahora <ArrowRight size={15} /></Link></div></div>
        </div>
      </section>

      <section className="benefits"><div className="container benefit-grid"><div><Truck /><span><strong>Envíos confiables</strong><small>Seguimiento de pedidos</small></span></div><div><ShieldCheck /><span><strong>Compra protegida</strong><small>Datos almacenados de forma segura</small></span></div><div><RefreshCcw /><span><strong>Gestión sencilla</strong><small>Carrito y pedidos persistentes</small></span></div><div><Headphones /><span><strong>Soporte cercano</strong><small>Atención al cliente</small></span></div></div></section>

      <section className="section" id="destacados"><div className="container"><div className="section-heading"><div><span className="eyebrow">SELECCIÓN ESPECIAL</span><h2>Productos destacados</h2></div><Link to="/catalogo">Ver todos <ArrowRight size={17} /></Link></div><div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} onAdd={handleAdd} />)}</div></div></section>

      <section className="section soft"><div className="container"><div className="section-heading"><div><span className="eyebrow">EXPLORA</span><h2>Compra por categoría</h2></div></div><div className="category-grid">{categories.map((category) => <Link key={category.name} to={`/catalogo?categoria=${category.name}`} className="category-card"><img src={category.image} alt={category.name} /><div><span>Descubrir</span><h3>{category.name}</h3><ArrowRight /></div></Link>)}</div></div></section>

      <section className="section"><div className="container promo-banner"><div><span className="eyebrow light-text">COMPRA INTELIGENTE</span><h2>Todo lo que necesitas en un solo lugar.</h2><p>Agrega productos al carrito, calcula el total y completa tu pedido en pocos pasos.</p><Link className="button light-button" to="/catalogo">Empezar a comprar <ArrowRight size={18} /></Link></div><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80" alt="Tienda moderna" /></div></section>
    </>
  );
}
