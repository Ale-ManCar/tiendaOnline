const env = import.meta.env;

const value = (key: string, fallback: string) => {
  const candidate = env[key];
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback;
};

const booleanValue = (key: string, fallback: boolean) => {
  const candidate = value(key, String(fallback)).toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(candidate);
};

const numberValue = (key: string, fallback: number) => {
  const candidate = Number(value(key, String(fallback)));
  return Number.isFinite(candidate) ? candidate : fallback;
};

export const storeConfig = {
  name: value('VITE_STORE_NAME', 'Nova Store'),
  legalName: value('VITE_STORE_LEGAL_NAME', value('VITE_STORE_NAME', 'Nova Store')),
  shortName: value('VITE_STORE_SHORT_NAME', 'NOVA'),
  logoLetter: value('VITE_STORE_LOGO_LETTER', 'N').slice(0, 2).toUpperCase(),
  announcement: value('VITE_STORE_ANNOUNCEMENT', 'Envío gratis en compras superiores a $100 · Compra segura'),
  tagline: value('VITE_STORE_TAGLINE', 'Productos útiles, diseño contemporáneo y una experiencia de compra simple.'),
  supportEmail: value('VITE_STORE_SUPPORT_EMAIL', 'soporte@novastore.com'),
  supportPhone: value('VITE_STORE_SUPPORT_PHONE', '+593 99 000 0000'),
  location: value('VITE_STORE_LOCATION', 'Guayaquil, Ecuador'),
  businessHours: value('VITE_STORE_BUSINESS_HOURS', 'Lun-Vie, 09:00-18:00'),
  footerNote: value('VITE_STORE_FOOTER_NOTE', 'Tienda online profesional'),
  defaultCheckoutCity: value('VITE_STORE_DEFAULT_CITY', 'Guayaquil'),
  shippingFlatRate: numberValue('VITE_SHIPPING_FLAT_RATE', 5),
  freeShippingThreshold: numberValue('VITE_FREE_SHIPPING_THRESHOLD', 100),
  shippingCoverageNote: value('VITE_SHIPPING_COVERAGE_NOTE', 'Entrega disponible según cobertura del negocio.'),
  enableCardPayments: booleanValue('VITE_ENABLE_CARD_PAYMENTS', false),
  enableBankTransfer: booleanValue('VITE_ENABLE_BANK_TRANSFER', true),
  enableCashOnDelivery: booleanValue('VITE_ENABLE_CASH_ON_DELIVERY', true),
  bankTransferInstructions: value(
    'VITE_BANK_TRANSFER_INSTRUCTIONS',
    'Realiza la transferencia y escribe el número de comprobante para que el equipo pueda validar tu pedido.',
  ),
  bankAccountLabel: value('VITE_BANK_ACCOUNT_LABEL', 'Cuenta bancaria por definir'),
  cashOnDeliveryInstructions: value(
    'VITE_CASH_ON_DELIVERY_INSTRUCTIONS',
    'Paga al recibir tu pedido. El equipo confirmará disponibilidad y zona de cobertura antes del envío.',
  ),
  cardPaymentInstructions: value(
    'VITE_CARD_PAYMENT_INSTRUCTIONS',
    'El pago con tarjeta requiere un proveedor de pagos conectado para operar en producción.',
  ),
  demoAdminEmail: value('VITE_DEMO_ADMIN_EMAIL', 'admin@tienda.com').toLowerCase(),
  enableDemoFallback: booleanValue('VITE_ENABLE_DEMO_FALLBACK', true),
};
