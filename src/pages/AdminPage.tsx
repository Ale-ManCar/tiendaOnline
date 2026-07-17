import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { OrderStatus } from '../types';

const tabs = {
  products: 'Productos',
  categories: 'Categorías',
  orders: 'Pedidos',
  users: 'Usuarios',
} as const;

export function AdminPage() {
  const store = useStore();
  const [tab, setTab] = useState<keyof typeof tabs>('products');

  if (store.currentUser?.role !== 'admin') return <Navigate to="/" replace />;

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

        <div className="admin-card">
          <div className="table-wrap">
            {tab === 'products' && (
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
                          <strong>{product.name}</strong>
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td>{product.category}</td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td>{product.active ? 'Activo' : 'Inactivo'}</td>
                      <td>
                        <button className="text-button danger" onClick={() => confirm('¿Eliminar producto?') && store.deleteProduct(product.id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </section>
  );
}
