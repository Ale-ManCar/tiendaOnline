import { KEYS } from '../utils/storage';

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
  supportEmail: value('VITE_STORE_SUPPORT_EMAIL', 'alemancar0511@gmail.com'),
  supportPhone: value('VITE_STORE_SUPPORT_PHONE', '0968822603'),
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

export type StoreSettings = Pick<
  typeof storeConfig,
  | 'name'
  | 'legalName'
  | 'shortName'
  | 'logoLetter'
  | 'announcement'
  | 'tagline'
  | 'supportEmail'
  | 'supportPhone'
  | 'location'
  | 'businessHours'
  | 'footerNote'
  | 'defaultCheckoutCity'
  | 'shippingFlatRate'
  | 'freeShippingThreshold'
  | 'shippingCoverageNote'
  | 'bankAccountLabel'
  | 'bankTransferInstructions'
  | 'cashOnDeliveryInstructions'
>;

export const defaultStoreSettings: StoreSettings = {
  name: storeConfig.name,
  legalName: storeConfig.legalName,
  shortName: storeConfig.shortName,
  logoLetter: storeConfig.logoLetter,
  announcement: storeConfig.announcement,
  tagline: storeConfig.tagline,
  supportEmail: storeConfig.supportEmail,
  supportPhone: storeConfig.supportPhone,
  location: storeConfig.location,
  businessHours: storeConfig.businessHours,
  footerNote: storeConfig.footerNote,
  defaultCheckoutCity: storeConfig.defaultCheckoutCity,
  shippingFlatRate: storeConfig.shippingFlatRate,
  freeShippingThreshold: storeConfig.freeShippingThreshold,
  shippingCoverageNote: storeConfig.shippingCoverageNote,
  bankAccountLabel: storeConfig.bankAccountLabel,
  bankTransferInstructions: storeConfig.bankTransferInstructions,
  cashOnDeliveryInstructions: storeConfig.cashOnDeliveryInstructions,
};

export function getStoreSettings(): StoreSettings {
  return pickStoreSettings(storeConfig);
}

export function loadStoreSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return getStoreSettings();
    const parsed = JSON.parse(raw) as { data?: Partial<StoreSettings> } | Partial<StoreSettings>;
    const data = parsed && typeof parsed === 'object' && 'data' in parsed && parsed.data ? parsed.data : (parsed as Partial<StoreSettings>);
    return normalizeStoreSettings(data);
  } catch {
    localStorage.removeItem(KEYS.settings);
    return getStoreSettings();
  }
}

export function saveStoreSettings(settings: StoreSettings) {
  const normalized = normalizeStoreSettings(settings);
  Object.assign(storeConfig, normalized);
  localStorage.setItem(KEYS.settings, JSON.stringify({ version: 1, data: normalized }));
  return normalized;
}

export function resetStoreSettings() {
  Object.assign(storeConfig, defaultStoreSettings);
  localStorage.removeItem(KEYS.settings);
  return defaultStoreSettings;
}

function normalizeStoreSettings(settings: Partial<StoreSettings>): StoreSettings {
  return {
    name: text(settings.name, defaultStoreSettings.name),
    legalName: text(settings.legalName, settings.name || defaultStoreSettings.legalName),
    shortName: text(settings.shortName, defaultStoreSettings.shortName).slice(0, 16),
    logoLetter: text(settings.logoLetter, defaultStoreSettings.logoLetter).slice(0, 2).toUpperCase(),
    announcement: text(settings.announcement, defaultStoreSettings.announcement),
    tagline: text(settings.tagline, defaultStoreSettings.tagline),
    supportEmail: text(settings.supportEmail, defaultStoreSettings.supportEmail).toLowerCase(),
    supportPhone: text(settings.supportPhone, defaultStoreSettings.supportPhone),
    location: text(settings.location, defaultStoreSettings.location),
    businessHours: text(settings.businessHours, defaultStoreSettings.businessHours),
    footerNote: text(settings.footerNote, defaultStoreSettings.footerNote),
    defaultCheckoutCity: text(settings.defaultCheckoutCity, defaultStoreSettings.defaultCheckoutCity),
    shippingFlatRate: money(settings.shippingFlatRate, defaultStoreSettings.shippingFlatRate),
    freeShippingThreshold: money(settings.freeShippingThreshold, defaultStoreSettings.freeShippingThreshold),
    shippingCoverageNote: text(settings.shippingCoverageNote, defaultStoreSettings.shippingCoverageNote),
    bankAccountLabel: text(settings.bankAccountLabel, defaultStoreSettings.bankAccountLabel),
    bankTransferInstructions: text(settings.bankTransferInstructions, defaultStoreSettings.bankTransferInstructions),
    cashOnDeliveryInstructions: text(settings.cashOnDeliveryInstructions, defaultStoreSettings.cashOnDeliveryInstructions),
  };
}

function pickStoreSettings(config: typeof storeConfig): StoreSettings {
  return normalizeStoreSettings(config);
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function money(value: unknown, fallback: number) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Number(amount.toFixed(2)) : fallback;
}

Object.assign(storeConfig, loadStoreSettings());
