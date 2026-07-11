import { useEffect, useState } from 'react';
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';
import { Toast, type ToastState } from './Toast';

export function Layout() {
  const { currentUser, cartCount, logout } = useStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastState>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(`/catalogo?q=${encodeURIComponent(search)}`);
    setMenuOpen(false);
  };

  return (
    <div className="site-shell">
      <div className="announcement">Envío gratis en compras superiores a $100 · Compra segura</div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand"><span>N</span> NOVA</Link>
          <nav className={menuOpen ? 'main-nav open' : 'main-nav'}>
            <NavLink to="/" onClick={() => setMenuOpen(false)}>Inicio</NavLink>
            <NavLink to="/catalogo" onClick={() => setMenuOpen(false)}>Catálogo</NavLink>
            {currentUser && <NavLink to="/pedidos" onClick={() => setMenuOpen(false)}>Mis pedidos</NavLink>}
            {currentUser?.role === 'admin' && <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Administración</NavLink>}
            <form className="mobile-search" onSubmit={submitSearch}><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos" /></form>
          </nav>
          <div className="header-actions">
            <form className="header-search" onSubmit={submitSearch}><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar" /></form>
            {currentUser ? (
              <div className="user-menu"><button className="header-icon user-trigger"><UserRound size={20} /><span>{currentUser.name.split(' ')[0]}</span></button><div className="user-popover"><strong>{currentUser.name}</strong><small>{currentUser.email}</small>{currentUser.role === 'admin' && <Link to="/admin">Panel administrativo</Link>}<button onClick={() => { logout(); setToast({ message: 'Sesión cerrada.', type: 'success' }); }}>Cerrar sesión</button></div></div>
            ) : <button className="header-icon" onClick={() => setAuthOpen(true)}><UserRound size={20} /><span>Ingresar</span></button>}
            <button className="header-icon cart-button" onClick={() => setCartOpen(true)}><ShoppingBag size={21} /><span>Carrito</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
            <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>
      <main><Outlet context={{ notify: setToast, openAuth: () => setAuthOpen(true) }} /></main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div><Link to="/" className="brand light"><span>N</span> NOVA</Link><p>Productos útiles, diseño contemporáneo y una experiencia de compra simple.</p></div>
          <div><h4>Navegación</h4><Link to="/">Inicio</Link><Link to="/catalogo">Catálogo</Link><Link to="/pedidos">Mis pedidos</Link></div>
          <div><h4>Ayuda</h4><a href="mailto:soporte@novastore.com">soporte@novastore.com</a><span>Guayaquil, Ecuador</span><span>Lun–Vie, 09:00–18:00</span></div>
          <div><h4>Pagos seguros</h4><p>Tarjeta, transferencia y pago contra entrega.</p></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 Nova Store</span><span>Proyecto académico · Universidad de Guayaquil</span></div>
      </footer>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} notify={setToast} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
