# Production readiness checklist

Use this checklist before delivering Nova Store to a paying client.

If an item is not complete, the store can still be shown as a preview, but it should not be treated as a production ecommerce system.

## 1. Runtime mode

- [ ] `VITE_ENABLE_DEMO_FALLBACK=false` in paid-client frontend environment.
- [ ] `VITE_API_URL` points to the client's real backend API.
- [ ] Frontend does not rely on GitHub Pages demo behavior.
- [ ] Backend is deployed and reachable from the frontend.
- [ ] Database is deployed and reachable from the backend.

## 2. Authentication

- [ ] Real administrator account exists.
- [ ] Demo administrator credentials are not used.
- [ ] Passwords are hashed server-side.
- [ ] Login works across devices.
- [ ] Logout works.
- [ ] Suspended users cannot log in.
- [ ] Session cookies are secure in production.
- [ ] Password recovery plan exists.

## 3. Catalog and inventory

- [ ] Products are stored in the client's database.
- [ ] Categories are stored in the client's database.
- [ ] Images are stable and not broken.
- [ ] SKUs are unique.
- [ ] Stock decreases after confirmed orders.
- [ ] Admin can create/edit/deactivate products.
- [ ] Admin can create/edit/deactivate categories.

## 4. Cart and checkout

- [ ] Cart works for logged-in users.
- [ ] Checkout validates required fields.
- [ ] IVA/VAT is calculated correctly.
- [ ] Order total equals subtotal plus taxes and shipping, if shipping is configured.
- [ ] Empty cart cannot be checked out.
- [ ] Out-of-stock products cannot be purchased.
- [ ] Order is saved in the database.

## 5. Payments

- [ ] Payment methods are defined for the client.
- [ ] Manual payment instructions are clear, if using transfer.
- [ ] Real payment provider is configured, if using cards or online payments.
- [ ] Payment webhooks are implemented before automatic paid status is enabled.
- [ ] Failed payments do not create paid orders.
- [ ] Payment references are stored.

## 6. Orders

- [ ] Customer can see order history.
- [ ] Admin can see all orders.
- [ ] Admin can update order status.
- [ ] Order status history is stored.
- [ ] Customer information is saved correctly.
- [ ] Shipping information is saved correctly.

## 7. Security

- [ ] Secrets are not committed to the repository.
- [ ] `.env` files are not committed.
- [ ] CORS only allows trusted domains.
- [ ] Rate limiting is enabled on auth endpoints.
- [ ] Input validation is enabled on backend DTOs.
- [ ] Cookies use production security settings.
- [ ] Database credentials are not exposed to the frontend.

## 8. Legal pages

- [ ] Terms and conditions page exists.
- [ ] Privacy policy page exists.
- [ ] Refund policy page exists.
- [ ] Shipping policy page exists.
- [ ] Support/contact information is visible.

## 9. Performance and SEO

- [ ] Page loads correctly on mobile.
- [ ] Product images are optimized or hosted reliably.
- [ ] Browser title and metadata match the client.
- [ ] Manifest name matches the client.
- [ ] Broken links are checked.
- [ ] No console errors in production.

## 10. Observability and support

- [ ] Backend logs are available.
- [ ] Error tracking is configured or planned.
- [ ] Database backups are configured.
- [ ] Deployment rollback plan exists.
- [ ] Support process is defined.
- [ ] Monthly maintenance scope is defined.

## 11. Final delivery decision

The store is production-ready only if:

- Real backend is active.
- Real database is active.
- Demo fallback is disabled.
- Admin can manage the store.
- Customer can complete checkout.
- Orders persist across devices.
- Client accepts final test.

