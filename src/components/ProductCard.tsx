import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (id: string) => void }) {
  return (
    <article className="product-card">
      <Link to={`/producto/${product.id}`} className="product-image-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.featured && <span className="product-badge">Destacado</span>}
      </Link>
      <div className="product-card-body">
        <span className="product-category">{product.category}</span>
        <Link to={`/producto/${product.id}`}><h3>{product.name}</h3></Link>
        <div className="product-meta">
          <strong>${product.price.toFixed(2)}</strong>
          <span className={product.stock > 0 ? 'in-stock' : 'out-stock'}>{product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}</span>
        </div>
        <div className="product-actions">
          <button className="button primary small" disabled={product.stock === 0} onClick={() => onAdd(product.id)}><ShoppingBag size={17} /> Agregar</button>
          <Link className="button ghost small" to={`/producto/${product.id}`}>Ver <ArrowRight size={16} /></Link>
        </div>
      </div>
    </article>
  );
}
