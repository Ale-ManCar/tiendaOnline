# Arquitectura

Monolito frontend modular: páginas y componentes consumen un contexto de aplicación; este coordina autenticación, catálogo, carritos y pedidos, y el adaptador de almacenamiento encapsula LocalStorage versionado. HashRouter mantiene compatibilidad con GitHub Pages. Una futura API puede reemplazar el contexto de persistencia manteniendo los contratos de dominio.
