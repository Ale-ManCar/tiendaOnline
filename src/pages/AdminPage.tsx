import { useMemo, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import type { Category, Order, OrderStatus, Product } from '../types';
import type { StoreSettings } from '../config/storeConfig';
import { formatMoney, formatShippingCost, getOrderShipping, getOrderTotal } from '../utils/orderDisplay';
import { categorySchema, productSchema } from '../validation/schemas';

const tabs = {
  insights: 'Resumen',
  products: 'Productos',
  categories: 'Categorías',
  orders: 'Pedidos',
  users: 'Usuarios',
  settings: 'Configuración',
} as const;

const LOW_STOCK_THRESHOLD = 5;

export function AdminPage() {
  const store = useStore();
  const [tab, setTab] = useState<keyof typeof tabs>('insights');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'Todos' | OrderStatus>('Todos');

  if (store.currentUser?.role !== 'admin') return <Navigate to="/" replace />;

  const activeProducts = store.products.filter((product) => product.active);
  const lowStockProducts = activeProducts.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD);
  const outOfStockProducts = activeProducts.filter((product) => product.stock === 0);
  const visibleProducts = showLowStockOnly ? store.products.filter((product) => product.active && product.stock <= LOW_STOCK_THRESHOLD) : store.products;
  const insights = getSalesInsights(store.orders);
  const visibleOrders = useMemo(() => {
    const search = orderSearch.trim().toLowerCase();

    return store.orders.filter((order) => {
      const shipping = getOrderShipping(order);
      const matchesStatus = orderStatusFilter === 'Todos' || order.status === orderStatusFilter;
      const matchesSearch =
        !search ||
        [
          order.id,
          shipping.fullName,
          shipping.email,
          shipping.phone,
          shipping.city,
          shipping.address,
          order.paymentMethod,
          order.paymentReference ?? '',
          order.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [orderSearch, orderStatusFilter, store.orders]);

  const closeProductForm = () => {
    setEditingProduct(null);
    setCreatingProduct(false);
  };

  const closeCategoryForm = () => {
    setEditingCategory(null);
    setCreatingCategory(false);
  };

  const exportOrderReport = () => {
    if (!visibleOrders.length) {
      setAdminMessage({ type: 'error', text: 'No hay pedidos para exportar con los filtros actuales.' });
      return;
    }

    downloadHtmlFile(
      `reporte-pedidos-${new Date().toISOString().slice(0, 10)}.html`,
      buildOrderReportHtml(visibleOrders, store.storeSettings, {
        search: orderSearch,
        status: orderStatusFilter,
      }),
    );
    setAdminMessage({ type: 'success', text: 'Reporte de pedidos exportado.' });
  };

  const updateProductQuickly = (product: Product, changes: Partial<Product>, successMessage: string) => {
    const result = store.updateProduct({ ...product, ...changes });
    setAdminMessage({ type: result.ok ? 'success' : 'error', text: result.ok ? successMessage : result.message });
  };

  const restockProduct = (product: Product) => {
    const amount = Number(prompt(`¿Cuántas unidades quieres agregar a "${product.name}"?`, '10'));
    if (!Number.isInteger(amount) || amount <= 0) {
      setAdminMessage({ type: 'error', text: 'Ingresa una cantidad entera mayor a cero.' });
      return;
    }

    updateProductQuickly(product, { stock: product.stock + amount, active: true }, `Stock actualizado: ${product.name} ahora tiene ${product.stock + amount} unidades.`);
  };

  const duplicateProduct = (product: Product) => {
    const baseSku = `${product.sku}-COPY`;
    let nextSku = baseSku;
    let counter = 2;

    while (store.products.some((candidate) => candidate.sku.toLowerCase() === nextSku.toLowerCase())) {
      nextSku = `${baseSku}-${counter}`;
      counter += 1;
    }

    const result = store.addProduct({
      name: `${product.name} copia`,
      description: product.description,
      category: product.category,
      categoryId: product.categoryId,
      defaultVariantId: product.defaultVariantId,
      price: product.price,
      stock: 0,
      image: product.image,
      featured: false,
      sku: nextSku,
      active: false,
    });

    setAdminMessage({ type: result.ok ? 'success' : 'error', text: result.ok ? `Producto duplicado como borrador con SKU ${nextSku}.` : result.message });
  };

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">ADMINISTRACIÓN</span>
            <h1>Panel de control</h1>
            <p>Supervisa catálogo, clientes y pedidos de la tienda.</p>
          </div>
        </div>

        <div className="admin-stats">
          <div>
            <span>
              <small>Ingresos</small>
              <strong>{formatMoney(store.orders.reduce((amount, order) => amount + getOrderTotal(order), 0))}</strong>
            </span>
          </div>
          <div>
            <span>
              <small>Productos activos</small>
              <strong>{activeProducts.length}</strong>
            </span>
          </div>
          <button
            className={`admin-stat-button ${showLowStockOnly ? 'active' : ''}`}
            onClick={() => {
              setTab('products');
              setShowLowStockOnly((current) => !current);
            }}
            type="button"
          >
            <span>
              <small>Stock bajo</small>
              <strong>{lowStockProducts.length + outOfStockProducts.length}</strong>
            </span>
          </button>
          <div>
            <span>
              <small>Pedidos</small>
              <strong>{store.orders.length}</strong>
            </span>
          </div>
          <div>
            <span>
              <small>Usuarios</small>
              <strong>{store.users.length}</strong>
            </span>
          </div>
        </div>

        <div className="admin-tabs">
          {(Object.keys(tabs) as Array<keyof typeof tabs>).map((tabKey) => (
            <button className={tab === tabKey ? 'active' : ''} onClick={() => setTab(tabKey)} key={tabKey}>
              {tabs[tabKey]}
            </button>
          ))}
        </div>

        {adminMessage && <p className={`admin-message ${adminMessage.type}`}>{adminMessage.text}</p>}

        <div className="admin-card">
          <div className="table-wrap">
            {tab === 'insights' && <SalesInsightsPanel insights={insights} orders={store.orders} />}

            {tab === 'products' && (
              <>
                <div className="admin-toolbar">
                  <div>
                    <h2>Catálogo</h2>
                    <p>
                      {showLowStockOnly
                        ? `Mostrando productos con ${LOW_STOCK_THRESHOLD} unidades o menos.`
                        : 'Agrega, edita, destaca o desactiva productos para la tienda.'}
                    </p>
                  </div>
                  <div className="admin-toolbar-actions">
                    <button className="button secondary" onClick={() => setShowLowStockOnly((current) => !current)}>
                      {showLowStockOnly ? 'Ver todo' : 'Ver stock bajo'}
                    </button>
                    <button className="button primary" onClick={() => setCreatingProduct(true)}>
                      Nuevo producto
                    </button>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>SKU</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.length === 0 && (
                      <tr>
                        <td className="empty-table" colSpan={7}>
                          {showLowStockOnly ? 'Inventario saludable: no hay productos con stock bajo.' : 'Todavía no hay productos registrados.'}
                        </td>
                      </tr>
                    )}
                    {visibleProducts.map((product) => (
                      <tr key={product.id}>
                        <td data-label="Producto">
                          <div className="table-product">
                            <ProductImage src={product.image} alt={product.name} />
                            <span>
                              <strong>{product.name}</strong>
                              {product.featured && <small>Destacado</small>}
                            </span>
                          </div>
                        </td>
                        <td data-label="SKU">{product.sku}</td>
                        <td data-label="Categoría">{product.category}</td>
                        <td data-label="Precio">${product.price.toFixed(2)}</td>
                        <td data-label="Stock">
                          <span className={product.active && product.stock <= LOW_STOCK_THRESHOLD ? 'low-stock' : ''}>{product.stock}</span>
                          {product.active && product.stock === 0 && <small className="block danger-text">Agotado</small>}
                          {product.active && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD && <small className="block warning-text">Reponer pronto</small>}
                        </td>
                        <td data-label="Estado">
                          {product.active ? 'Activo' : 'Inactivo'}
                          {product.active && product.stock <= LOW_STOCK_THRESHOLD && <span className="stock-badge">Stock bajo</span>}
                        </td>
                        <td data-label="Acción">
                          <div className="table-actions inline">
                            <button onClick={() => setEditingProduct(product)}>Editar</button>
                            <button onClick={() => updateProductQuickly(product, { featured: !product.featured }, product.featured ? 'Producto quitado de destacados.' : 'Producto marcado como destacado.')}>
                              {product.featured ? 'No destacar' : 'Destacar'}
                            </button>
                            <button onClick={() => updateProductQuickly(product, { active: !product.active }, product.active ? 'Producto ocultado del catálogo.' : 'Producto visible en el catálogo.')}>
                              {product.active ? 'Ocultar' : 'Mostrar'}
                            </button>
                            <button onClick={() => restockProduct(product)}>Reponer</button>
                            <button onClick={() => duplicateProduct(product)}>Duplicar</button>
                            <button className="danger" onClick={() => confirm('¿Eliminar producto?') && store.deleteProduct(product.id)}>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {tab === 'categories' && (
              <>
                <div className="admin-toolbar">
                  <div>
                    <h2>Categorías</h2>
                    <p>Organiza el catálogo y oculta categorías sin borrar productos.</p>
                  </div>
                  <button className="button primary" onClick={() => setCreatingCategory(true)}>
                    Nueva categoría
                  </button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Slug</th>
                      <th>Productos</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.categories.map((category) => (
                      <tr key={category.id}>
                        <td data-label="Nombre">
                          <strong>{category.name}</strong>
                          {category.description && <small className="block">{category.description}</small>}
                        </td>
                        <td data-label="Slug">{category.slug}</td>
                        <td data-label="Productos">{store.products.filter((product) => product.category === category.name || product.categoryId === category.id).length}</td>
                        <td data-label="Estado">{category.active ? 'Activa' : 'Inactiva'}</td>
                        <td data-label="Acción">
                          <div className="table-actions inline">
                            <button onClick={() => setEditingCategory(category)}>Editar</button>
                            <button className="danger" onClick={() => confirm('¿Eliminar categoría?') && store.deleteCategory(category.id)}>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {tab === 'orders' && (
              <>
                <div className="admin-toolbar">
                  <div>
                    <h2>Pedidos</h2>
                    <p>Busca, filtra y exporta reportes listos para revisar o imprimir.</p>
                  </div>
                  <div className="admin-toolbar-actions">
                    <button className="button secondary" type="button" onClick={exportOrderReport}>
                      Exportar reporte
                    </button>
                  </div>
                </div>

                <div className="admin-filters">
                  <label>
                    Buscar pedido
                    <input
                      value={orderSearch}
                      onChange={(event) => setOrderSearch(event.target.value)}
                      placeholder="Código, cliente, ciudad, pago..."
                    />
                  </label>
                  <label>
                    Estado
                    <select value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value as 'Todos' | OrderStatus)}>
                      <option>Todos</option>
                      {(['Pendiente', 'Procesando', 'Enviado', 'Entregado'] as OrderStatus[]).map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <span>{visibleOrders.length} de {store.orders.length} pedidos</span>
                </div>

                <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Envío</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => {
                    const shipping = getOrderShipping(order);

                    return (
                      <tr key={order.id}>
                        <td data-label="Código">{order.id}</td>
                        <td data-label="Cliente">
                          {shipping.fullName}
                          <small className="block">{shipping.email}</small>
                        </td>
                        <td data-label="Envío">
                          {formatShippingCost(order.shippingCost)}
                          <small className="block">{shipping.city}</small>
                        </td>
                        <td data-label="Total">{formatMoney(order.total)}</td>
                        <td data-label="Pago">
                          {order.paymentMethod}
                          {order.paymentReference && <small className="block">Ref: {order.paymentReference}</small>}
                        </td>
                        <td data-label="Estado">
                          <select value={order.status} onChange={(event) => store.updateOrderStatus(order.id, event.target.value as OrderStatus)}>
                            {(['Pendiente', 'Procesando', 'Enviado', 'Entregado'] as OrderStatus[]).map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td data-label="Acción">
                          <div className="table-actions inline">
                            <button onClick={() => setSelectedOrder(order)}>Ver</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                    {visibleOrders.length === 0 && (
                      <tr>
                        <td className="empty-table" colSpan={7}>
                          No hay pedidos que coincidan con los filtros.
                        </td>
                      </tr>
                    )}
                </tbody>
                </table>
              </>
            )}

            {tab === 'users' && (
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Registro</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {store.users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString('es-EC')}</td>
                      <td>{user.active ? 'Activo' : 'Inactivo'}</td>
                      <td>
                        {user.id !== 'user-admin' && (
                          <button className="text-button" onClick={() => store.toggleUser(user.id)}>
                            {user.active ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'settings' && (
              <StoreSettingsPanel
                key={JSON.stringify(store.storeSettings)}
                settings={store.storeSettings}
                onSubmit={(settings) => {
                  const result = store.updateStoreSettings(settings);
                  setAdminMessage({ type: result.ok ? 'success' : 'error', text: result.message });
                }}
                onReset={() => {
                  const result = store.restoreDefaultStoreSettings();
                  setAdminMessage({ type: result.ok ? 'success' : 'error', text: result.message });
                }}
              />
            )}
          </div>
        </div>
      </div>

      {(creatingProduct || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          categories={store.categories}
          onClose={closeProductForm}
          onSubmit={(formProduct) => {
            const category = store.categories.find((candidate) => candidate.name === formProduct.category);
            const result = editingProduct
              ? store.updateProduct({
                  ...editingProduct,
                  ...formProduct,
                  categoryId: category?.id,
                })
              : store.addProduct({
                  ...formProduct,
                  categoryId: category?.id,
                });

            setAdminMessage({ type: result.ok ? 'success' : 'error', text: result.message });
            if (result.ok) closeProductForm();
          }}
        />
      )}

      {(creatingCategory || editingCategory) && (
        <CategoryFormModal
          category={editingCategory}
          onClose={closeCategoryForm}
          onSubmit={(formCategory) => {
            const result = editingCategory
              ? store.updateCategory({
                  ...editingCategory,
                  ...formCategory,
                })
              : store.addCategory(formCategory);

            setAdminMessage({ type: result.ok ? 'success' : 'error', text: result.message });
            if (result.ok) closeCategoryForm();
          }}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          settings={store.storeSettings}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(status) => {
            const result = store.updateOrderStatus(selectedOrder.id, status);
            setSelectedOrder((currentOrder) =>
              currentOrder
                ? {
                    ...currentOrder,
                    status,
                    statusHistory: [...(currentOrder.statusHistory ?? []), { status, date: new Date().toISOString() }],
                  }
                : currentOrder,
            );
            setAdminMessage({ type: result.ok ? 'success' : 'error', text: result.message });
          }}
        />
      )}
    </section>
  );
}

type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
type CategoryFormData = Omit<Category, 'id' | 'createdAt' | 'slug'>;

type SalesInsights = ReturnType<typeof getSalesInsights>;

function SalesInsightsPanel({ insights, orders }: { insights: SalesInsights; orders: Order[] }) {
  return (
    <section className="sales-insights">
      <div className="admin-toolbar">
        <div>
          <h2>Resumen comercial</h2>
          <p>Una lectura rápida del rendimiento actual de la tienda y los pedidos recientes.</p>
        </div>
      </div>

      <div className="insight-grid">
        <article>
          <small>Ingresos totales</small>
          <strong>{formatMoney(insights.revenue)}</strong>
          <span>{orders.length} pedidos registrados</span>
        </article>
        <article>
          <small>Ticket promedio</small>
          <strong>{formatMoney(insights.averageOrderValue)}</strong>
          <span>Promedio por pedido</span>
        </article>
        <article>
          <small>Pedidos pendientes</small>
          <strong>{insights.pendingOrders}</strong>
          <span>Requieren revisión</span>
        </article>
        <article>
          <small>Pedidos entregados</small>
          <strong>{insights.deliveredOrders}</strong>
          <span>Ventas completadas</span>
        </article>
      </div>

      <div className="insight-columns">
        <article className="insight-card">
          <h3>Productos más vendidos</h3>
          {insights.topProducts.length ? (
            <div className="rank-list">
              {insights.topProducts.map((product, index) => (
                <div key={product.name}>
                  <span>{index + 1}</span>
                  <strong>{product.name}</strong>
                  <small>{product.quantity} unidades · {formatMoney(product.revenue)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">Aún no hay productos vendidos.</p>
          )}
        </article>

        <article className="insight-card">
          <h3>Ingresos por método de pago</h3>
          {insights.paymentMix.length ? (
            <div className="rank-list">
              {insights.paymentMix.map((payment) => (
                <div key={payment.method}>
                  <span>{payment.count}</span>
                  <strong>{payment.method}</strong>
                  <small>{formatMoney(payment.revenue)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">Aún no hay pagos registrados.</p>
          )}
        </article>
      </div>

      <article className="insight-card">
        <h3>Pedidos recientes</h3>
        {insights.recentOrders.length ? (
          <div className="recent-orders">
            {insights.recentOrders.map((order) => {
              const shipping = getOrderShipping(order);

              return (
                <div key={order.id}>
                  <span>
                    <strong>{order.id}</strong>
                    <small>{shipping.fullName}</small>
                  </span>
                  <span>{formatMoney(order.total)}</span>
                  <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted-text">Cuando entren pedidos, aparecerán aquí.</p>
        )}
      </article>
    </section>
  );
}

function getSalesInsights(orders: Order[]) {
  const revenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const averageOrderValue = orders.length ? revenue / orders.length : 0;
  const pendingOrders = orders.filter((order) => order.status === 'Pendiente').length;
  const deliveredOrders = orders.filter((order) => order.status === 'Entregado').length;
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  const paymentMap = new Map<string, { method: string; count: number; revenue: number }>();

  orders.forEach((order) => {
    const payment = paymentMap.get(order.paymentMethod) ?? { method: order.paymentMethod, count: 0, revenue: 0 };
    payment.count += 1;
    payment.revenue += getOrderTotal(order);
    paymentMap.set(order.paymentMethod, payment);

    (order.items ?? []).forEach((item) => {
      const product = productMap.get(item.name) ?? { name: item.name, quantity: 0, revenue: 0 };
      product.quantity += item.quantity;
      product.revenue += item.price * item.quantity;
      productMap.set(item.name, product);
    });
  });

  return {
    revenue,
    averageOrderValue,
    pendingOrders,
    deliveredOrders,
    topProducts: [...productMap.values()].sort((first, second) => second.quantity - first.quantity).slice(0, 5),
    paymentMix: [...paymentMap.values()].sort((first, second) => second.revenue - first.revenue),
    recentOrders: [...orders].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 5),
  };
}

function downloadHtmlFile(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildOrderReportHtml(orders: Order[], settings: StoreSettings, filters: { search: string; status: 'Todos' | OrderStatus }) {
  const revenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const subtotal = orders.reduce((sum, order) => sum + (order.subtotal ?? 0), 0);
  const tax = orders.reduce((sum, order) => sum + (order.tax ?? 0), 0);
  const shipping = orders.reduce((sum, order) => sum + (order.shippingCost ?? 0), 0);
  const generatedAt = new Date().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
  const filterText = [
    filters.status !== 'Todos' ? `Estado: ${filters.status}` : 'Todos los estados',
    filters.search.trim() ? `Búsqueda: ${filters.search.trim()}` : 'Sin búsqueda',
  ].join(' · ');

  const rows = orders
    .map((order) => {
      const orderShipping = getOrderShipping(order);

      return `
        <tr>
          <td><strong>${escapeHtml(order.id)}</strong><small>${escapeHtml(formatDate(order.createdAt))}</small></td>
          <td>${escapeHtml(orderShipping.fullName)}<small>${escapeHtml(orderShipping.email)}</small></td>
          <td>${escapeHtml(orderShipping.city)}<small>${escapeHtml(orderShipping.address)}</small></td>
          <td>${escapeHtml(order.paymentMethod)}<small>${escapeHtml(order.paymentReference || 'Sin referencia')}</small></td>
          <td><span class="status">${escapeHtml(order.status)}</span></td>
          <td class="money">${escapeHtml(formatMoney(order.subtotal))}</td>
          <td class="money">${escapeHtml(formatMoney(order.tax))}</td>
          <td class="money">${escapeHtml(formatShippingCost(order.shippingCost))}</td>
          <td class="money total">${escapeHtml(formatMoney(getOrderTotal(order)))}</td>
        </tr>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reporte de pedidos - ${escapeHtml(settings.name)}</title>
  <style>
    :root { color: #17191f; background: #f4f4f1; font-family: Arial, Helvetica, sans-serif; }
    body { margin: 0; padding: 34px; }
    main { max-width: 1180px; margin: 0 auto; background: #fff; border: 1px solid #dedbd4; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 80px rgba(20,20,18,.08); }
    header { display: flex; justify-content: space-between; gap: 28px; padding: 34px; background: #17191f; color: #fff; }
    header span { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 14px; background: #ff5a3d; font-size: 24px; font-weight: 900; margin-bottom: 18px; }
    h1 { margin: 0 0 8px; font-size: 38px; letter-spacing: -.04em; }
    p { margin: 0; color: #737780; line-height: 1.55; }
    header p { color: #d7d7d7; }
    .meta { text-align: right; min-width: 240px; }
    .meta strong { display: block; margin-bottom: 8px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 24px 34px; background: #fbfbf9; border-bottom: 1px solid #e4e1da; }
    .summary article { padding: 18px; border: 1px solid #e4e1da; border-radius: 18px; background: #fff; }
    .summary small { display: block; color: #737780; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; font-weight: 800; margin-bottom: 8px; }
    .summary strong { font-size: 24px; letter-spacing: -.03em; }
    .table-wrap { padding: 26px 34px 34px; overflow-x: auto; }
    table { width: 100%; min-width: 980px; border-collapse: collapse; }
    th { text-align: left; color: #737780; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; padding: 12px 10px; border-bottom: 1px solid #e4e1da; }
    td { padding: 16px 10px; border-bottom: 1px solid #eeeae4; vertical-align: top; }
    td small { display: block; color: #737780; margin-top: 5px; font-size: 12px; }
    .money { text-align: right; white-space: nowrap; }
    .total { font-weight: 900; }
    .status { display: inline-flex; padding: 7px 11px; border-radius: 999px; background: #fff1bd; color: #735200; font-size: 12px; font-weight: 800; }
    footer { padding: 18px 34px 30px; color: #737780; font-size: 12px; }
    @media print { body { padding: 0; background: #fff; } main { box-shadow: none; border: 0; border-radius: 0; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <span>${escapeHtml(settings.logoLetter)}</span>
        <h1>Reporte de pedidos</h1>
        <p>${escapeHtml(settings.name)} · ${escapeHtml(filterText)}</p>
      </div>
      <div class="meta">
        <strong>Generado</strong>
        <p>${escapeHtml(generatedAt)}</p>
        <p>${escapeHtml(settings.supportEmail)}</p>
      </div>
    </header>
    <section class="summary">
      <article><small>Pedidos</small><strong>${orders.length}</strong></article>
      <article><small>Subtotal</small><strong>${escapeHtml(formatMoney(subtotal))}</strong></article>
      <article><small>IVA</small><strong>${escapeHtml(formatMoney(tax))}</strong></article>
      <article><small>Total</small><strong>${escapeHtml(formatMoney(revenue))}</strong></article>
    </section>
    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Pago</th><th>Estado</th><th>Subtotal</th><th>IVA</th><th>Envío</th><th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
    <footer>
      ${escapeHtml(settings.legalName)} · ${escapeHtml(settings.location)} · Envío acumulado: ${escapeHtml(formatMoney(shipping))}
    </footer>
  </main>
</body>
</html>`;
}

function StoreSettingsPanel({
  settings,
  onSubmit,
  onReset,
}: {
  settings: StoreSettings;
  onSubmit: (settings: StoreSettings) => void;
  onReset: () => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onSubmit({
      name: String(form.get('name') ?? ''),
      legalName: String(form.get('legalName') ?? ''),
      shortName: String(form.get('shortName') ?? ''),
      logoLetter: String(form.get('logoLetter') ?? ''),
      announcement: String(form.get('announcement') ?? ''),
      tagline: String(form.get('tagline') ?? ''),
      supportEmail: String(form.get('supportEmail') ?? ''),
      supportPhone: String(form.get('supportPhone') ?? ''),
      location: String(form.get('location') ?? ''),
      businessHours: String(form.get('businessHours') ?? ''),
      footerNote: String(form.get('footerNote') ?? ''),
      defaultCheckoutCity: String(form.get('defaultCheckoutCity') ?? ''),
      shippingFlatRate: Number(form.get('shippingFlatRate') ?? 0),
      freeShippingThreshold: Number(form.get('freeShippingThreshold') ?? 0),
      shippingCoverageNote: String(form.get('shippingCoverageNote') ?? ''),
      bankAccountLabel: String(form.get('bankAccountLabel') ?? ''),
      bankTransferInstructions: String(form.get('bankTransferInstructions') ?? ''),
      cashOnDeliveryInstructions: String(form.get('cashOnDeliveryInstructions') ?? ''),
    });
  };

  return (
    <form className="settings-panel" onSubmit={submit}>
      <div className="admin-toolbar">
        <div>
          <h2>Configuración de tienda</h2>
          <p>Personaliza la identidad, contacto y reglas comerciales visibles para el cliente.</p>
        </div>
        <div className="admin-toolbar-actions">
          <button className="button secondary" type="button" onClick={() => confirm('¿Restaurar la configuración original?') && onReset()}>
            Restaurar
          </button>
          <button className="button primary" type="submit">
            Guardar cambios
          </button>
        </div>
      </div>

      <div className="settings-preview">
        <span>{settings.logoLetter}</span>
        <div>
          <small>Vista previa de marca</small>
          <strong>{settings.shortName}</strong>
          <p>{settings.tagline}</p>
        </div>
        <em>{settings.announcement}</em>
      </div>

      <div className="settings-grid">
        <fieldset>
          <legend>Marca</legend>
          <label>Nombre de tienda<input name="name" defaultValue={settings.name} required /></label>
          <label>Nombre legal<input name="legalName" defaultValue={settings.legalName} required /></label>
          <label>Nombre corto<input name="shortName" defaultValue={settings.shortName} required /></label>
          <label>Logo simple<input name="logoLetter" defaultValue={settings.logoLetter} maxLength={2} required /></label>
          <label className="full-span">Frase de marca<textarea name="tagline" defaultValue={settings.tagline} required /></label>
          <label className="full-span">Barra superior<textarea name="announcement" defaultValue={settings.announcement} required /></label>
        </fieldset>

        <fieldset>
          <legend>Contacto</legend>
          <label>Correo de soporte<input name="supportEmail" type="email" defaultValue={settings.supportEmail} required /></label>
          <label>Teléfono<input name="supportPhone" defaultValue={settings.supportPhone} required /></label>
          <label>Ubicación<input name="location" defaultValue={settings.location} required /></label>
          <label>Horario<input name="businessHours" defaultValue={settings.businessHours} required /></label>
          <label className="full-span">Nota del footer<input name="footerNote" defaultValue={settings.footerNote} required /></label>
        </fieldset>

        <fieldset>
          <legend>Envíos y pago</legend>
          <label>Ciudad por defecto<input name="defaultCheckoutCity" defaultValue={settings.defaultCheckoutCity} required /></label>
          <label>Costo fijo de envío<input name="shippingFlatRate" type="number" min="0" step="0.01" defaultValue={settings.shippingFlatRate} required /></label>
          <label>Mínimo para envío gratis<input name="freeShippingThreshold" type="number" min="0" step="0.01" defaultValue={settings.freeShippingThreshold} required /></label>
          <label>Cuenta bancaria<input name="bankAccountLabel" defaultValue={settings.bankAccountLabel} required /></label>
          <label className="full-span">Nota de cobertura<textarea name="shippingCoverageNote" defaultValue={settings.shippingCoverageNote} required /></label>
          <label className="full-span">Instrucciones de transferencia<textarea name="bankTransferInstructions" defaultValue={settings.bankTransferInstructions} required /></label>
          <label className="full-span">Instrucciones contra entrega<textarea name="cashOnDeliveryInstructions" defaultValue={settings.cashOnDeliveryInstructions} required /></label>
        </fieldset>
      </div>
    </form>
  );
}

function OrderDetailModal({
  order,
  settings,
  onClose,
  onStatusChange,
}: {
  order: Order;
  settings: StoreSettings;
  onClose: () => void;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const shipping = getOrderShipping(order);
  const phoneDigits = shipping.phone.replace(/\D/g, '');
  const whatsappPhone = phoneDigits.startsWith('593') ? phoneDigits : phoneDigits.replace(/^0/, '593');
  const whatsappMessages = phoneDigits ? getAdminWhatsAppMessages(order, settings, shipping, whatsappPhone) : [];
  const history = order.statusHistory?.length ? order.statusHistory : [{ status: order.status, date: order.createdAt }];

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="product-modal admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close icon-button" type="button" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <div className="admin-order-head">
          <div>
            <span className="eyebrow">PEDIDO</span>
            <h2 id="order-detail-title">{order.id}</h2>
            <p>{formatDate(order.createdAt)}</p>
          </div>
          <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
        </div>

        <div className="admin-order-grid">
          <article className="admin-order-panel">
            <h3>Cliente y entrega</h3>
            <dl>
              <div>
                <dt>Nombre</dt>
                <dd>{shipping.fullName}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{shipping.email}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{shipping.phone}</dd>
              </div>
              <div>
                <dt>Ciudad</dt>
                <dd>{shipping.city}, {shipping.province}</dd>
              </div>
              <div>
                <dt>Dirección</dt>
                <dd>{shipping.address}</dd>
              </div>
              {shipping.notes && (
                <div>
                  <dt>Notas</dt>
                  <dd>{shipping.notes}</dd>
                </div>
              )}
            </dl>
            {whatsappMessages.length > 0 && (
              <div className="whatsapp-quick-actions">
                <h4>Mensajes rápidos</h4>
                {whatsappMessages.map((message) => (
                  <a className="button secondary full" href={message.url} target="_blank" rel="noreferrer" key={message.label}>
                    {message.label}
                  </a>
                ))}
              </div>
            )}
          </article>

          <article className="admin-order-panel">
            <h3>Pago y estado</h3>
            <dl>
              <div>
                <dt>Método</dt>
                <dd>{order.paymentMethod}</dd>
              </div>
              <div>
                <dt>Referencia</dt>
                <dd>{order.paymentReference || 'Sin referencia'}</dd>
              </div>
            </dl>
            <label className="admin-status-control">
              Estado del pedido
              <select value={order.status} onChange={(event) => onStatusChange(event.target.value as OrderStatus)}>
                {(['Pendiente', 'Procesando', 'Enviado', 'Entregado'] as OrderStatus[]).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </article>
        </div>

        <article className="admin-order-panel">
          <h3>Productos</h3>
          <div className="admin-order-items">
            {(order.items ?? []).map((item) => (
              <div key={`${item.productId}-${item.name}`}>
                <ProductImage src={item.image} alt={item.name} />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.quantity} × {formatMoney(item.price)}</small>
                </span>
                <b>{formatMoney(item.price * item.quantity)}</b>
              </div>
            ))}
          </div>
        </article>

        <div className="admin-order-bottom">
          <article className="admin-order-panel">
            <h3>Resumen</h3>
            <div className="admin-order-totals">
              <span>Subtotal <strong>{formatMoney(order.subtotal)}</strong></span>
              <span>IVA 15% <strong>{formatMoney(order.tax)}</strong></span>
              <span>Envío <strong>{formatShippingCost(order.shippingCost)}</strong></span>
              <span className="total">Total <strong>{formatMoney(order.total)}</strong></span>
            </div>
          </article>

          <article className="admin-order-panel">
            <h3>Historial</h3>
            <ol className="admin-status-timeline">
              {history.map((entry, index) => (
                <li key={`${entry.status}-${entry.date}-${index}`}>
                  <strong>{entry.status}</strong>
                  <small>{formatDate(entry.date)}</small>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return 'Fecha no registrada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no registrada';
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getAdminWhatsAppMessages(order: Order, settings: StoreSettings, shipping: ReturnType<typeof getOrderShipping>, phone: string) {
  const firstName = shipping.fullName.split(' ')[0] || shipping.fullName;
  const products = (order.items ?? []).map((item) => `• ${item.quantity} x ${item.name}`).join('\n');
  const deliveryLine = `${shipping.address}, ${shipping.city}`;
  const total = formatMoney(getOrderTotal(order));
  const paymentReference = order.paymentReference ? `\nReferencia registrada: ${order.paymentReference}` : '';
  const bankLine = settings.bankAccountLabel ? `\nDatos de pago: ${settings.bankAccountLabel}` : '';
  const signature = `\n\n${settings.name}`;
  const buildUrl = (message: string) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return [
    {
      label: 'Confirmar pedido',
      url: buildUrl(
        `Hola ${firstName}, confirmamos tu pedido ${order.id} por ${total}.\n\nProductos:\n${products}\n\nEntrega: ${deliveryLine}\nEstado actual: ${order.status}.${signature}`,
      ),
    },
    {
      label: 'Enviar datos de pago',
      url: buildUrl(
        `Hola ${firstName}, para avanzar con tu pedido ${order.id} por ${total}, puedes realizar el pago y enviarnos el comprobante por este chat.${bankLine}${paymentReference}${signature}`,
      ),
    },
    {
      label: 'Avisar que está en camino',
      url: buildUrl(
        `Hola ${firstName}, tu pedido ${order.id} ya está en camino.\n\nEntrega: ${deliveryLine}\nTotal: ${total}\n\nTe avisaremos cualquier novedad.${signature}`,
      ),
    },
    {
      label: 'Avisar entrega completada',
      url: buildUrl(
        `Hola ${firstName}, registramos tu pedido ${order.id} como entregado. Gracias por comprar en ${settings.name}. Si necesitas ayuda con tu compra, puedes escribirnos por este chat.`,
      ),
    },
  ];
}

function CategoryFormModal({
  category,
  onClose,
  onSubmit,
}: {
  category: Category | null;
  onClose: () => void;
  onSubmit: (category: CategoryFormData) => void;
}) {
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const parsed = categorySchema.safeParse({
      name: String(form.get('name') ?? ''),
      description: String(form.get('description') ?? ''),
      active: form.get('active') === 'on',
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos de la categoría.');
      return;
    }

    onSubmit(parsed.data);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="product-modal admin-product-form" onSubmit={submit}>
        <button className="modal-close icon-button" type="button" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="auth-head">
          <span className="eyebrow">CATEGORÍAS</span>
          <h2>{category ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <p>Controla cómo se organizan los productos dentro del catálogo.</p>
        </div>

        <div className="form-grid">
          <label>
            Nombre *
            <input name="name" defaultValue={category?.name} required />
          </label>
          <label className="full-span">
            Descripción
            <textarea name="description" defaultValue={category?.description ?? ''} />
          </label>
          <label className="checkbox-label">
            <input name="active" type="checkbox" defaultChecked={category?.active ?? true} /> Categoría activa
          </label>
        </div>

        {error && <p className="form-error prominent">{error}</p>}

        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit">
            {category ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProductFormModal({
  product,
  categories,
  onClose,
  onSubmit,
}: {
  product: Product | null;
  categories: { id: string; name: string; active: boolean }[];
  onClose: () => void;
  onSubmit: (product: ProductFormData) => void;
}) {
  const [error, setError] = useState('');
  const activeCategories = categories.filter((category) => category.active || category.name === product?.category);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!activeCategories.length) {
      setError('Crea al menos una categoría activa antes de agregar productos.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const parsed = productSchema.safeParse({
      name: String(form.get('name') ?? ''),
      description: String(form.get('description') ?? ''),
      category: String(form.get('category') ?? ''),
      sku: String(form.get('sku') ?? ''),
      price: form.get('price'),
      stock: form.get('stock'),
      image: String(form.get('image') ?? ''),
      featured: form.get('featured') === 'on',
      active: form.get('active') === 'on',
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos del producto.');
      return;
    }

    onSubmit({
      ...parsed.data,
      defaultVariantId: product?.defaultVariantId,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="product-modal admin-product-form" onSubmit={submit}>
        <button className="modal-close icon-button" type="button" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="auth-head">
          <span className="eyebrow">CATÁLOGO</span>
          <h2>{product ? 'Editar producto' : 'Nuevo producto'}</h2>
          <p>Completa la información visible para los clientes en la tienda.</p>
        </div>

        <div className="form-grid">
          <label>
            Nombre *
            <input name="name" defaultValue={product?.name} required />
          </label>
          <label>
            SKU *
            <input name="sku" defaultValue={product?.sku} required />
          </label>
          <label>
            Categoría *
            <select name="category" defaultValue={product?.category ?? activeCategories[0]?.name ?? ''} required>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Precio *
            <input name="price" type="number" min="0.01" step="0.01" defaultValue={product?.price ?? 1} required />
          </label>
          <label>
            Stock *
            <input name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} required />
          </label>
          <label className="full-span">
            Imagen URL *
            <input name="image" type="url" defaultValue={product?.image} placeholder="https://..." required />
          </label>
          <label className="full-span">
            Descripción *
            <textarea name="description" defaultValue={product?.description} required />
          </label>
          <label className="checkbox-label">
            <input name="featured" type="checkbox" defaultChecked={product?.featured ?? false} /> Producto destacado
          </label>
          <label className="checkbox-label">
            <input name="active" type="checkbox" defaultChecked={product?.active ?? true} /> Producto activo
          </label>
        </div>

        {error && <p className="form-error prominent">{error}</p>}

        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit">
            {product ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
