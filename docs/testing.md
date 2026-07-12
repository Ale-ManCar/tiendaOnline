# Testing

The storefront uses Vitest and jsdom with `npm test`; `npm run test:coverage` generates the V8 coverage report. The backend uses Jest through `npm test -- --runInBand` from `server/`.

Current testing priorities are authentication, authorization, catalog reads, cart isolation, stock calculations, defensive storage parsing, and API validation.
