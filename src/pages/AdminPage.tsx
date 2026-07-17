import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { OrderStatus, Product } from '../types';
import { productSchema } from '../validation/schemas';

const tabs = {
  products: 'Productos',
  categories: 'Categorías',
  orders: 'Pedidos',
  users: 'Usuarios',
} as const;

export function AdminPage() {
  const store = useStore();
  const [tab, setTab] = useState<keyof typeof tabs>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (store.currentUser?.role !== 'admin') return <Navigate to="/" replace />;

  const closeProductForm = () => {
    setEditingProduct(null);
    setCreatingProduct(false);
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
              <strong>${store.orders.reduce((amount, order) => amount + order.total, 0).toFixed(2)}</strong>
            </span>
          </div>
          <div>
            <span>
              <small>Productos activos</small>
              <strong>{store.products.filter((product) => product.active).length}</strong>
            </span>
          </div>
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
                    <p>Agrega, edita, destaca o desactiva productos para la tienda.</p>
                  </div>
                  <button className="button primary" onClick={() => setCreatingProduct(true)}>
                    Nuevo producto
                  </button>
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
                    {store.products.map((product) => (
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
                        <td>{product.stock}</td>
                        <td>{product.active ? 'Activo' : 'Inactivo'}</td>
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
                <form
                  className="admin-toolbar"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    store.addCategory({
                      name: String(form.get('name')),
                      description: String(form.get('description')),
                      active: true,
                    });
                    event.currentTarget.reset();
                  }}
                >
                  <input name="name" required placeholder="Nueva categoría" />
                  <input name="description" placeholder="Descripción" />
                  <button className="button primary">Crear</button>
                </form>
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
                        <td>{category.name}</td>
                        <td>{category.slug}</td>
                        <td>{store.products.filter((product) => product.category === category.name).length}</td>
                        <td>{category.active ? 'Activa' : 'Inactiva'}</td>
                        <td>
                          <button className="text-button danger" onClick={() => confirm('¿Eliminar categoría?') && store.deleteCategory(category.id)}>
                            Eliminar
                          </button>
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
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {store.orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>
                        {order.shipping.fullName}
                        <small className="block">{order.shipping.email}</small>
                      </td>
                      <td>${order.total.toFixed(2)}</td>
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
                    </tr>
                  ))}
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
    </section>
  );
}

type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

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
  const activeCategories = categories.filter((category) => category.active);

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
