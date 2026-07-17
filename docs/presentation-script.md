# Guion de presentacion - Nova Store

Este guion esta pensado para una exposicion de 3 a 5 minutos. Puedes leerlo casi tal cual o usarlo como base para explicar el proyecto con tus propias palabras.

## 1. Introduccion

Buenos dias. Mi proyecto se llama Nova Store y consiste en una tienda en linea desarrollada como una aplicacion web moderna.

La idea principal no fue crear solo una pagina visual, sino representar el funcionamiento basico de un ecommerce: el usuario puede explorar productos, iniciar sesion, agregar articulos al carrito, simular una compra, revisar sus pedidos y, ademas, existe un panel administrativo para representar la gestion interna de la tienda.

## 2. Proposito del sistema

Nova Store tiene como proposito demostrar como podria funcionar una tienda digital desde dos perspectivas:

- La perspectiva del cliente, que busca productos y realiza una compra.
- La perspectiva del administrador, que necesita controlar la operacion general del sistema.

Esto permite que el proyecto no se vea solamente como una maqueta, sino como una base funcional que podria evolucionar hacia un producto real.

## 3. Flujo del cliente

Desde la pagina principal, el usuario puede entrar al catalogo y ver los productos disponibles.

El catalogo cuenta con categorias, busqueda, filtros y ordenamiento. Esto ayuda a que el usuario encuentre productos de forma mas rapida.

Cuando el usuario elige un producto, puede verlo con mas detalle o agregarlo directamente al carrito. El carrito conserva los productos seleccionados y permite modificar cantidades o eliminar articulos.

Luego, en el checkout, el usuario completa sus datos de entrega, selecciona un metodo de pago simulado y confirma el pedido. El sistema calcula el subtotal, el IVA del 15% y el total final.

Finalmente, se genera una confirmacion del pedido y el usuario puede revisar su historial de pedidos.

## 4. Inicio de sesion y usuarios

El sistema incluye registro e inicio de sesion.

Para que la pagina funcione desde GitHub Pages, sin depender de Docker ni de un servidor local, se implemento un modo demo. Esto permite probar la tienda desde computadoras o celulares.

Hay dos cuentas principales de demostracion:

- Administrador: `admin@tienda.com`
- Cliente: `cliente@tienda.com`

Las cuentas creadas manualmente se guardan en el navegador del dispositivo donde se registran. Esto sucede porque GitHub Pages no ejecuta una base de datos real; solamente hospeda el frontend.

## 5. Rol del administrador

El administrador representa la parte operativa del negocio.

Su existencia es importante porque una tienda real no solo necesita una interfaz para comprar, tambien necesita una forma de administrar la informacion interna.

En Nova Store, el administrador permite explicar que el sistema contempla una separacion entre el usuario cliente y el usuario que gestiona la tienda.

## 6. Arquitectura y tecnologias

El proyecto fue construido con React, TypeScript y Vite.

Se utilizo React Router para la navegacion entre paginas, Context API para manejar el estado principal del sistema, y servicios separados para organizar la logica de autenticacion, catalogo, pedidos y modo demo.

La aplicacion esta desplegada en GitHub Pages mediante GitHub Actions, lo que permite que los cambios se compilen y publiquen automaticamente.

## 7. Version movil

La tienda tambien fue ajustada para funcionar en dispositivos moviles.

Esto es importante porque una tienda en linea debe poder usarse desde telefonos, no solo desde una computadora. Se mejoraron el menu, el catalogo, los filtros, las tarjetas de producto y los botones para que sean mas comodos en pantallas pequenas.

## 8. Limitaciones actuales

Actualmente, Nova Store funciona como una demostracion avanzada.

Sus principales limitaciones son:

- Los pagos son simulados.
- Los usuarios creados manualmente no se sincronizan entre dispositivos.
- Los pedidos se guardan en el navegador local.
- No hay una base de datos real conectada en produccion.

Estas limitaciones existen porque el sitio esta publicado en GitHub Pages, que no ejecuta backend ni base de datos.

## 9. Mejoras futuras

Para convertir Nova Store en una tienda real, las siguientes mejoras serian:

- Hospedar un backend en produccion.
- Conectar una base de datos PostgreSQL.
- Implementar pagos reales.
- Agregar recuperacion de contrasena.
- Guardar pedidos y usuarios de forma centralizada.
- Agregar auditoria, monitoreo y notificaciones por correo.

## 10. Cierre

En conclusion, Nova Store demuestra una experiencia completa de ecommerce: catalogo, carrito, checkout, pedidos, usuarios y administracion.

El proyecto esta preparado para presentarse desde GitHub Pages y tambien tiene una estructura que podria evolucionar hacia una solucion mas realista con backend, base de datos y pagos en produccion.

