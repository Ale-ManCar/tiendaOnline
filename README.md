# Nova Store

Tienda en línea frontend desarrollada con React, TypeScript y Vite. Implementa los requisitos funcionales del documento académico: registro, inicio de sesión, catálogo, búsqueda, carrito, cálculo del total, checkout simulado, confirmación, historial de pedidos y administración de productos.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Ejecutar el proyecto

```bash
npm install
npm run dev
```

Abrir la dirección mostrada por Vite, normalmente `http://localhost:5173`.

## Compilar para producción

```bash
npm run build
npm run preview
```

## Acceso de administrador

- Correo: `admin@tienda.com`
- Contraseña: `Admin123*`

## Persistencia

Los usuarios, productos, carrito y pedidos se almacenan en `localStorage`. El pago es una simulación académica y no procesa dinero real.

## Restablecer datos

Abre las herramientas de desarrollo del navegador, entra en **Application > Local Storage** y elimina las claves que comienzan con `nova_`.
