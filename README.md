# Nova Store

E-commerce académico frontend construido con React, TypeScript, Vite, React Router y LocalStorage. Incluye catálogo, filtros, detalle, registro e inicio de sesión, carrito de invitado y por usuario, checkout con IVA del 15%, historial de pedidos y administración de productos, categorías, pedidos y usuarios.

## Desarrollo

Requiere Node.js 22. Ejecuta `npm ci`, `npm run dev`, `npm test`, `npm run test:coverage` y `npm run build`. Demo administrativa: `admin@tienda.com` / `Admin123*`. Para reiniciar la demo, elimina las claves `nova_*` desde LocalStorage.

La aplicación usa `HashRouter` porque GitHub Pages no reescribe rutas hacia `index.html`. Vite conserva `base: '/tiendaOnline/'`; una pantalla en blanco suele indicar que el nombre del repositorio y ese base no coinciden. El workflow publica únicamente `dist` después de pruebas y build.

## Persistencia

Los datos se guardan en envoltorios `{ version, data }`, se leen defensivamente y se migran desde las estructuras antiguas. Cada cuenta dispone de un carrito independiente; el carrito invitado se combina al iniciar sesión sin superar existencias.

## Security limitations of the academic version

Esta autenticación es una simulación. LocalStorage puede ser leído o modificado con las herramientas del navegador y un hash frontend no sustituye autenticación segura. No se guardan datos de tarjeta. Producción requiere backend, base de datos, HTTPS, Argon2/bcrypt, sesiones seguras, autorización y validación del lado servidor, rate limiting, cabeceras de seguridad, logs, monitoreo, copias de seguridad, auditoría y una pasarela de pagos real.

Consulta [arquitectura](docs/architecture.md), [modelo de datos](docs/data-model.md), [pruebas](docs/testing.md), [despliegue](docs/deployment.md) y [limitaciones](docs/limitations.md).
