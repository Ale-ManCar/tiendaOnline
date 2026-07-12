# Nova Store

Nova Store is evolving into a production-oriented ecommerce platform. The existing React, TypeScript, Vite, and React Router storefront is now accompanied by a NestJS, PostgreSQL, and Prisma backend foundation. LocalStorage remains only as a temporary compatibility layer while each frontend module moves to server-controlled data.

## Desarrollo

Requires Node.js 22. For the storefront, run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. For the API, follow [server/README.md](server/README.md). The legacy local demo credentials remain available only until server authentication replaces them.

La aplicación usa `HashRouter` porque GitHub Pages no reescribe rutas hacia `index.html`. Vite conserva `base: '/tiendaOnline/'`; una pantalla en blanco suele indicar que el nombre del repositorio y ese base no coinciden. El workflow publica únicamente `dist` después de pruebas y build.

## Persistencia

Los datos se guardan en envoltorios `{ version, data }`, se leen defensivamente y se migran desde las estructuras antiguas. Cada cuenta dispone de un carrito independiente; el carrito invitado se combina al iniciar sesión sin superar existencias.

## Current migration security limitations

The current storefront authentication is still simulated until it is connected to the new API. LocalStorage can be manipulated through browser tools and must not control prices, stock, permissions, or orders in production. The backend foundation introduces the boundary for PostgreSQL persistence, Argon2 credentials, secure sessions, server authorization, audit logs, and payment adapters; those modules will be implemented incrementally before real sales are enabled.

Consulta [arquitectura](docs/architecture.md), [modelo de datos](docs/data-model.md), [pruebas](docs/testing.md), [despliegue](docs/deployment.md) y [limitaciones](docs/limitations.md).
