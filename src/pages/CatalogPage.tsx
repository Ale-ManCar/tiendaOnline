import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import type { ToastState } from '../components/Toast';
import { useStore } from '../context/StoreContext';

type OutletContext = { notify: (toast: ToastState) => void };

export function CatalogPage() {
  const { products, addToCart, catalogLoading, catalogError } = useStore();
  const { notify } = useOutletContext<OutletContext>();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('categoria') ?? 'Todas');
  const [sort, setSort] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(150);
  const [filtersOpen, setFiltersOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth > 560));
  const visibleProducts = useMemo(() => products.filter((product) => product.active), [products]);
  const categories = ['Todas', ...Array.from(new Set(visibleProducts.map((product) => product.category)))];
  const hasActiveFilters = Boolean(search || category !== 'Todas' || sort !== 'featured' || maxPrice !== 150);

  useEffect(() => {
    const syncFiltersForViewport = () => {
      if (window.innerWidth > 560) setFiltersOpen(true);
    };
    syncFiltersForViewport();
    window.addEventListener('resize', syncFiltersForViewport);
    return () => window.removeEventListener('resize', syncFiltersForViewport);
  }, []);

  const filtered = useMemo(() => {
    const normalized = search.toLowerCase().trim();
    return [...visibleProducts]
      .filter((product) => category === 'Todas' || product.category === category)
      .filter((product) => product.price <= maxPrice)
      .filter((product) => !normalized || `${product.name} ${product.category}`.toLowerCase().includes(normalized))
      .sort((a, b) => {
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'price-desc') return b.price - a.price;
        if (sort === 'name') return a.name.localeCompare(b.name);
        return Number(b.featured) - Number(a.featured);
      });
  }, [visibleProducts, search, category, sort, maxPrice]);

  const clearFilters = () => {
    setSearch('');
    setCategory('Todas');
    setSort('featured');
    setMaxPrice(150);
    setParams({});
  };
  const handleAdd = (id: string) => {
    const result = addToCart(id);
    notify({ message: result.message, type: result.ok ? 'success' : 'error' });
  };

  if (catalogLoading) return <section className="section"><div className="container empty-state boxed" role="status"><h2>Loading products…</h2></div></section>;
  if (catalogError) return <section className="section"><div className="container empty-state boxed" role="alert"><h2>We could not load the catalog</h2><p>{catalogError}</p><button className="button primary" onClick={() => location.reload()}>Try again</button></div></section>;

  return (
    <section className="section catalog-page">
      <div className="container">
        <div className="page-intro catalog-intro">
          <span className="eyebrow">CATÁLOGO</span>
          <h1>Encuentra algo para ti</h1>
          <p>Busca, filtra y ordena los productos disponibles.</p>
        </div>
        <div className="catalog-layout">
          <aside className={filtersOpen ? 'filters-panel open' : 'filters-panel'}>
            <div className="filters-title">
              <button className="filter-toggle" type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
                <SlidersHorizontal size={18} /> Filtros
              </button>
              <button className="text-button" onClick={clearFilters}>Limpiar</button>
            </div>
            <div className="filters-content">
              <label>Buscar<div className="input-icon"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setParams(event.target.value ? { q: event.target.value } : {}); }} placeholder="Nombre o categoría" /></div></label>
              <label>Categoría<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Precio máximo <strong>${maxPrice}</strong><input type="range" min="20" max="150" step="5" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} /></label>
              <label>Ordenar<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Destacados</option><option value="price-asc">Precio: menor a mayor</option><option value="price-desc">Precio: mayor a menor</option><option value="name">Nombre A–Z</option></select></label>
            </div>
          </aside>
          <div className="catalog-results">
            <div className="results-bar">
              <span><strong>{filtered.length}</strong> productos encontrados</span>
              {hasActiveFilters && <button className="filter-chip" onClick={clearFilters}>Filtros activos <X size={14} /></button>}
            </div>
            {filtered.length > 0 ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} onAdd={handleAdd} />)}</div> : <div className="empty-state boxed"><Search size={46} /><h3>No encontramos resultados</h3><p>Prueba con otro término o elimina los filtros.</p><button className="button primary" onClick={clearFilters}>Restablecer filtros</button></div>}
          </div>
        </div>
      </div>
    </section>
  );
}
