const env = import.meta.env;

const value = (key: string, fallback: string) => {
  const candidate = env[key];
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback;
};

const booleanValue = (key: string, fallback: boolean) => {
  const candidate = value(key, String(fallback)).toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(candidate);
};

export const storeConfig = {
  name: value('VITE_STORE_NAME', 'Nova Store'),
  shortName: value('VITE_STORE_SHORT_NAME', 'NOVA'),
  logoLetter: value('VITE_STORE_LOGO_LETTER', 'N').slice(0, 2).toUpperCase(),
  announcement: value('VITE_STORE_ANNOUNCEMENT', 'Envío gratis en compras superiores a $100 · Compra segura'),
  tagline: value('VITE_STORE_TAGLINE', 'Productos útiles, diseño contemporáneo y una experiencia de compra simple.'),
  supportEmail: value('VITE_STORE_SUPPORT_EMAIL', 'soporte@novastore.com'),
  location: value('VITE_STORE_LOCATION', 'Guayaquil, Ecuador'),
  businessHours: value('VITE_STORE_BUSINESS_HOURS', 'Lun-Vie, 09:00-18:00'),
  footerNote: value('VITE_STORE_FOOTER_NOTE', 'Tienda online profesional'),
  defaultCheckoutCity: value('VITE_STORE_DEFAULT_CITY', 'Guayaquil'),
  demoAdminEmail: value('VITE_DEMO_ADMIN_EMAIL', 'admin@tienda.com').toLowerCase(),
  enableDemoFallback: booleanValue('VITE_ENABLE_DEMO_FALLBACK', true),
};
