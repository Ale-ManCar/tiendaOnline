import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { Category, Order, OrderStatus, Product } from '../types';
import { formatMoney, formatShippingCost, getOrderShipping, getOrderTotal } from '../utils/orderDisplay';
import { categorySchema, productSchema } from '../validation/schemas';

const tabs = {
  products: 'Productos',
  categories: 'Categorías',
  orders: 'Pedidos',
  users: 'Usuarios',
} as const;

const LOW_STOCK_THRESHOLD = 5;

export function AdminPage() {
  const store = useStore();
  const [tab, setTab] = useState<keyof typeof tabs>('products');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (store.currentUser?.role !== 'admin') return <Navigate to="/" replace />;

  const activeProducts = store.products.filter((product) => product.active);
  const lowStockProducts = activeProducts.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD);
  const outOfStockProducts = activeProducts.filter((product) => product.stock === 0);
  const visibleProducts = showLowStockOnly ? store.products.filter((product) => product.active && product.stock <= LOW_STOCK_THRESHOLD) : store.products;

  const closeProductForm = () => {
    setEditingProduct(null);
    setCreatingProduct(false);
  };

  const closeCategoryForm = () => {
    setEditingCategory(null);
    setCreatingCategory(false);
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
                        <td>
                          <div className="table-product">
                            <img src={product.image} alt="" />
                            <span>
                              <strong>{product.name}</strong>
                              {product.featured && <small>Destacado</small>}
                            </span>
                          </div>
                        </td>
                        <td>{product.sku}</td>
                        <td>{product.category}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>
                          <span className={product.active && product.stock <= LOW_STOCK_THRESHOLD ? 'low-stock' : ''}>{product.stock}</span>
                          {product.active && product.stock === 0 && <small className="block danger-text">Agotado</small>}
                          {product.active && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD && <small className="block warning-text">Reponer pronto</small>}
                        </td>
                        <td>
                          {product.active ? 'Activo' : 'Inactivo'}
                          {product.active && product.stock <= LOW_STOCK_THRESHOLD && <span className="stock-badge">Stock bajo</span>}
                        </td>
                        <td>
                          <div className="table-actions inline">
                            <button onClick={() => setEditingProduct(product)}>Editar</button>
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
                        <td>
                          <strong>{category.name}</strong>
                          {category.description && <small className="block">{category.description}</small>}
                        </td>
                        <td>{category.slug}</td>
                        <td>{store.products.filter((product) => product.category === category.name || product.categoryId === category.id).length}</td>
                        <td>{category.active ? 'Activa' : 'Inactiva'}</td>
                        <td>
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
                  {store.orders.map((order) => {
                    const shipping = getOrderShipping(order);

                    return (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>
                          {shipping.fullName}
                          <small className="block">{shipping.email}</small>
                        </td>
                        <td>
                          {formatShippingCost(order.shippingCost)}
                          <small className="block">{shipping.city}</small>
                        </td>
                        <td>{formatMoney(order.total)}</td>
                        <td>
                          {order.paymentMethod}
                          {order.paymentReference && <small className="block">Ref: {order.paymentReference}</small>}
                        </td>
                        <td>
                          <select value={order.status} onChange={(event) => store.updateOrderStatus(order.id, event.target.value as OrderStatus)}>
                            {(['Pendiente', 'Procesando', 'Enviado', 'Entregado'] as OrderStatus[]).map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="table-actions inline">
                            <button onClick={() => setSelectedOrder(order)}>Ver</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const shipping = getOrderShipping(order);
  const phoneDigits = shipping.phone.replace(/\D/g, '');
  const whatsappPhone = phoneDigits.startsWith('593') ? phoneDigits : phoneDigits.replace(/^0/, '593');
  const whatsappMessage = encodeURIComponent(`Hola ${shipping.fullName}, te contactamos por tu pedido ${order.id} en Nova Store.`);
  const whatsappUrl = phoneDigits ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}` : '';
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
            {whatsappUrl && (
              <a className="button secondary full" href={whatsappUrl} target="_blank" rel="noreferrer">
                Contactar por WhatsApp
              </a>
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
                <img src={item.image} alt={item.name} />
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
