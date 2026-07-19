# Client onboarding checklist

Use this checklist every time Nova Store is sold as a separate deployment for a new customer.

The goal is to avoid improvising. Each client should receive a consistent setup process, even if the branding, products, domain, and payment method are different.

## 1. Business information

Collect the following before starting implementation:

- Business legal name.
- Store public name.
- Logo or brand mark.
- Main brand color.
- Secondary brand color, if any.
- Store slogan or short value proposition.
- Support email.
- Support phone or WhatsApp.
- Business location.
- Business hours.
- Social media links.
- Preferred domain.

## 2. Store configuration

Configure these frontend environment variables per client:

```env
VITE_STORE_NAME=
VITE_STORE_LEGAL_NAME=
VITE_STORE_SHORT_NAME=
VITE_STORE_LOGO_LETTER=
VITE_STORE_ANNOUNCEMENT=
VITE_STORE_TAGLINE=
VITE_STORE_SUPPORT_EMAIL=
VITE_STORE_SUPPORT_PHONE=
VITE_STORE_LOCATION=
VITE_STORE_BUSINESS_HOURS=
VITE_STORE_FOOTER_NOTE=
VITE_STORE_DEFAULT_CITY=
VITE_SHIPPING_FLAT_RATE=
VITE_FREE_SHIPPING_THRESHOLD=
VITE_SHIPPING_COVERAGE_NOTE=
VITE_ENABLE_CARD_PAYMENTS=false
VITE_ENABLE_BANK_TRANSFER=true
VITE_ENABLE_CASH_ON_DELIVERY=true
VITE_BANK_TRANSFER_INSTRUCTIONS=
VITE_BANK_ACCOUNT_LABEL=
VITE_CASH_ON_DELIVERY_INSTRUCTIONS=
VITE_CARD_PAYMENT_INSTRUCTIONS=
VITE_API_URL=
VITE_ENABLE_DEMO_FALLBACK=false
```

For paid deployments, `VITE_ENABLE_DEMO_FALLBACK` must be `false`.

## 3. Catalog setup

Request the initial product catalog in a structured format:

- Product name.
- Description.
- Category.
- Price.
- Stock.
- SKU.
- Product image.
- Featured status.
- Active/inactive status.

Minimum recommended initial catalog:

- 5 to 8 categories.
- 20 to 40 products.
- 4 to 8 featured products.
- At least one product image per product.

## 4. Admin account setup

Each client needs at least one administrator.

Collect:

- Admin full name.
- Admin email.
- Temporary password delivery method.
- Whether the admin should be forced to change password later.

Do not reuse the demo admin credentials for paid clients.

## 5. Payment setup

Confirm how the client wants to receive payments:

- Cash on delivery.
- Bank transfer.
- Card payment.
- PayPal.
- Stripe.
- Local payment provider.

For real card payments, do not mark the store as production-ready until webhooks, payment confirmation, and order status updates are working.

If the client starts with manual payments, configure bank-transfer instructions and require the customer to enter a transfer reference during checkout.

## 6. Shipping setup

Define shipping rules:

- Cities/provinces covered.
- Fixed shipping price or variable price.
- Free shipping threshold.
- Delivery times.
- Pickup option, if available.
- Delivery provider, if any.

The storefront currently supports a configurable flat shipping rate and a free-shipping threshold through `VITE_SHIPPING_FLAT_RATE` and `VITE_FREE_SHIPPING_THRESHOLD`.

## 7. Legal and policy pages

Request or draft:

- Terms and conditions.
- Privacy policy.
- Refund policy.
- Shipping policy.
- Contact/support policy.

These pages are important before selling to real customers.

## 8. Deployment setup

For each client, create or configure:

- Frontend host.
- Backend host.
- PostgreSQL database.
- Environment variables.
- Custom domain.
- SSL certificate.
- Admin credentials.
- Backup strategy.
- Error logging.

## 9. Acceptance test with client

Before delivery, test with the client:

- Storefront loads on desktop.
- Storefront loads on mobile.
- Products are correct.
- Prices are correct.
- Stock is correct.
- Cart works.
- Checkout works.
- Admin can log in.
- Admin can manage products/orders.
- Emails or payment confirmations work, if enabled.
- Domain works.

## 10. Delivery package

At delivery, provide:

- Store URL.
- Admin URL.
- Admin credentials delivery method.
- Support contact.
- Maintenance terms.
- What is included in monthly support.
- What requires extra payment.
