# Data Model

`User` stores identity, role, account status, and authentication session ownership. `RefreshSession` stores hashed refresh tokens so sessions can be rotated and revoked.

`Category`, `Product`, `ProductImage`, and `ProductVariant` model the public catalog. Product variants own SKU, price, physical stock, reserved stock, and availability.

`Order` stores the server-calculated commercial record for checkout: customer identity, status, subtotal, tax, shipping total, discount total, final total, shipping address snapshot, notes, item snapshots, payments, and status history. `OrderItem` copies the product name, SKU, unit price, quantity, and line total at purchase time so later catalog edits do not rewrite historical orders.

`Payment` is ready for provider integration through `provider`, `providerReference`, `method`, `status`, `amount`, currency, and an idempotency key. Real payment authorization and webhooks are still future work.
