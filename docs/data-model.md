# Modelo de datos

`User` contiene identidad, rol, estado y fecha de registro. `Product` contiene SKU, categoría, precio, stock y estado. `Category` usa nombre y slug únicos. `CartItem` referencia producto y cantidad. `Order` conserva instantáneas `OrderItem`, `ShippingData`, `PaymentMethod`, IVA, totales, estado e historial.
