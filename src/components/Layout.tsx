import { useEffect, useRef, useState } from 'react';
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';
import { ChangePasswordModal } from './ChangePasswordModal';
import { Toast, type ToastState } from './Toast';

export function Layout() {
  const { currentUser, cartCount, logout, storeSettings } = useStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastState>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const closeUserMenu = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };
    window.addEventListener('pointerdown', closeUserMenu);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('pointerdown', closeUserMenu);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(`/catalogo?q=${encodeURIComponent(search)}`);
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const closeNavigation = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <div className="site-shell">
      <div className="announcement">{storeSettings.announcement}</div>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" onClick={closeNavigation}><span>{storeSettings.logoLetter}</span> {storeSettings.shortName}</Link>
          <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="Navegación principal">
            <NavLink to="/" onClick={closeNavigation}>Inicio</NavLink>
            <NavLink to="/catalogo" onClick={closeNavigation}>Catálogo</NavLink>
            {currentUser && currentUser.role !== 'admin' && <NavLink to="/pedidos" onClick={closeNavigation}>Mis pedidos</NavLink>}
            {currentUser?.role === 'admin' && <NavLink to="/admin" onClick={closeNavigation}>Administración</NavLink>}
            <form className="mobile-search" onSubmit={submitSearch}>
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar productos" />
            </form>
          </nav>
          <div className="header-actions">
            <form className="header-search" onSubmit={submitSearch}>
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" />
            </form>
            {currentUser ? (
              <div className="user-menu" ref={userMenuRef}>
                <button
                  className="header-icon user-trigger"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => {
                    setUserMenuOpen((open) => !open);
                    setMenuOpen(false);
                  }}
                >
                  <UserRound size={20} />
                  <span>{currentUser.name.split(' ')[0]}</span>
                </button>
                <div className={userMenuOpen ? 'user-popover open' : 'user-popover'} role="menu">
                  <strong>{currentUser.name}</strong>
                  <small>{currentUser.email}</small>
                  {currentUser.role === 'admin' && <Link to="/admin" role="menuitem" onClick={closeNavigation}>Panel administrativo</Link>}
                  <button
                    role="menuitem"
                    onClick={() => {
                      setChangePasswordOpen(true);
                      closeNavigation();
                    }}
                  >
                    Cambiar contraseña
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      logout();
                      closeNavigation();
                      setToast({ message: 'Sesión cerrada.', type: 'success' });
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <button className="header-icon" onClick={() => setAuthOpen(true)}><UserRound size={20} /><span>Ingresar</span></button>
            )}
            <button className="header-icon cart-button" onClick={() => setCartOpen(true)}><ShoppingBag size={21} /><span>Carrito</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
            <button className="mobile-menu" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={() => { setMenuOpen(!menuOpen); setUserMenuOpen(false); }}>{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>
      <main><Outlet context={{ notify: setToast, openAuth: () => setAuthOpen(true) }} /></main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div><Link to="/" className="brand light"><span>{storeSettings.logoLetter}</span> {storeSettings.shortName}</Link><p>{storeSettings.tagline}</p></div>
          <div><h4>Navegación</h4><Link to="/">Inicio</Link><Link to="/catalogo">Catálogo</Link>{currentUser?.role !== 'admin' && <Link to="/pedidos">Mis pedidos</Link>}</div>
          <div><h4>Ayuda</h4><Link to="/legal/contacto">Contacto</Link><a href={`mailto:${storeSettings.supportEmail}`}>{storeSettings.supportEmail}</a><span>{storeSettings.location}</span><span>{storeSettings.businessHours}</span></div>
          <div><h4>Legal</h4><Link to="/legal/terminos">Términos y condiciones</Link><Link to="/legal/privacidad">Privacidad</Link><Link to="/legal/devoluciones">Devoluciones</Link><Link to="/legal/envios">Envíos</Link></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 {storeSettings.name}</span><span>{storeSettings.footerNote}</span></div>
      </footer>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} notify={setToast} />
      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} notify={setToast} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
