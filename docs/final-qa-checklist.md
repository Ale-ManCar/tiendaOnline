# Checklist final de QA - Nova Store

Usa esta lista antes de presentar el proyecto. La idea es verificar lo esencial sin perder tiempo en pruebas demasiado largas.

## 1. Acceso general

- [ ] Abrir la pagina publicada: `https://ale-mancar.github.io/tiendaOnline/`
- [ ] Confirmar que carga la pagina principal.
- [ ] Confirmar que no aparece pantalla en blanco.
- [ ] Confirmar que el menu superior se ve correctamente.
- [ ] Confirmar que el sitio se puede abrir en una ventana privada/incognito.

## 2. Prueba en computadora

- [ ] Abrir Inicio.
- [ ] Abrir Catalogo.
- [ ] Buscar un producto por nombre.
- [ ] Filtrar por categoria.
- [ ] Cambiar el precio maximo.
- [ ] Ordenar productos.
- [ ] Abrir el detalle de un producto.
- [ ] Agregar un producto al carrito.
- [ ] Abrir el carrito.
- [ ] Aumentar y reducir cantidad.
- [ ] Eliminar un producto del carrito.

## 3. Prueba en movil

- [ ] Abrir la pagina desde un telefono.
- [ ] Confirmar que el header no se rompe.
- [ ] Abrir y cerrar el menu movil.
- [ ] Entrar al Catalogo.
- [ ] Abrir y cerrar filtros.
- [ ] Agregar un producto al carrito.
- [ ] Abrir el carrito.
- [ ] Confirmar que los botones se pueden tocar comodamente.
- [ ] Confirmar que no hay desplazamiento horizontal raro.

## 4. Login de cliente

Cuenta demo:

- Email: `cliente@tienda.com`
- Password: `Cliente123*`

Pruebas:

- [ ] Abrir el modal de login.
- [ ] Iniciar sesion con el cliente demo.
- [ ] Confirmar que aparece el usuario en el header.
- [ ] Cerrar sesion.
- [ ] Volver a iniciar sesion.

## 5. Login de administrador

Cuenta demo:

- Email: `admin@tienda.com`
- Password: `Administrador123*`

Pruebas:

- [ ] Iniciar sesion como administrador.
- [ ] Abrir el menu del usuario.
- [ ] Entrar al panel administrativo.
- [ ] Confirmar que el panel carga.
- [ ] Revisar que se vean productos, categorias, pedidos o usuarios.
- [ ] Cerrar sesion.

## 6. Carrito y checkout

- [ ] Iniciar sesion como cliente demo.
- [ ] Agregar al menos un producto al carrito.
- [ ] Ir al checkout.
- [ ] Completar datos de entrega.
- [ ] Elegir metodo de pago.
- [ ] Confirmar pedido.
- [ ] Ver pagina de confirmacion.
- [ ] Confirmar que aparece codigo de pedido.
- [ ] Confirmar que el total incluye IVA del 15%.
- [ ] Ir a Mis pedidos.
- [ ] Confirmar que el pedido aparece en el historial.

## 7. IVA / VAT

- [ ] Verificar subtotal del pedido.
- [ ] Confirmar que el impuesto es 15% del subtotal.
- [ ] Confirmar que total = subtotal + IVA.

Nota: IVA y VAT significan lo mismo. IVA es el termino en espanol; VAT es el termino en ingles.

## 8. Imagenes y catalogo

- [ ] Confirmar que no haya imagenes rotas en el catalogo.
- [ ] Revisar especialmente el producto ChargeGo Power Bank.
- [ ] Confirmar que la seccion de destacados en Inicio muestra productos correctamente.
- [ ] Confirmar que hay varias categorias disponibles.

## 9. Explicacion de limitaciones

Si preguntan por que un usuario creado en un telefono no aparece en otra computadora, responder:

> La version publicada en GitHub Pages funciona en modo demo. GitHub Pages solo hospeda archivos estaticos, no ejecuta base de datos ni backend. Por eso, las cuentas creadas manualmente se guardan en el navegador del dispositivo donde se registran. Para una version real se conectaria un backend con PostgreSQL.

## 10. Ultima revision antes de exponer

- [ ] Tener abierta la pagina publicada.
- [ ] Tener preparado el usuario cliente demo.
- [ ] Tener preparado el usuario administrador demo.
- [ ] Tener lista una compra de prueba.
- [ ] Tener abierto el PDF o documento de apoyo.
- [ ] Probar el sitio al menos una vez en movil.
- [ ] Probar el sitio al menos una vez en computadora.

## 11. Comando opcional si se presenta localmente

Solo si vas a correrlo en tu PC:

```bash
npm install
npm run dev
```

Pero para la exposicion normal, usa GitHub Pages para no depender de tu computadora.

