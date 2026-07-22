import { Link, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { storeConfig } from '../config/storeConfig';

type PolicyKey = 'terminos' | 'privacidad' | 'devoluciones' | 'envios' | 'contacto';

const policyTitles: Record<PolicyKey, { eyebrow: string; title: string; description: string }> = {
  terminos: {
    eyebrow: 'Condiciones de compra',
    title: 'Términos y condiciones',
    description: 'Reglas generales para comprar, usar la tienda y gestionar pedidos.',
  },
  privacidad: {
    eyebrow: 'Datos personales',
    title: 'Política de privacidad',
    description: 'Cómo recopilamos, usamos y protegemos la información de nuestros clientes.',
  },
  devoluciones: {
    eyebrow: 'Cambios y garantías',
    title: 'Política de devoluciones',
    description: 'Condiciones para solicitar cambios, devoluciones o revisión de productos.',
  },
  envios: {
    eyebrow: 'Entregas',
    title: 'Política de envíos',
    description: 'Información sobre cobertura, tiempos de entrega y seguimiento de pedidos.',
  },
  contacto: {
    eyebrow: 'Atención al cliente',
    title: 'Contacto y soporte',
    description: 'Canales oficiales para consultas, soporte de pedidos y atención comercial.',
  },
};

const policySections: Record<Exclude<PolicyKey, 'contacto'>, Array<{ title: string; body: string }>> = {
  terminos: [
    {
      title: 'Uso de la tienda',
      body: `Al comprar en ${storeConfig.name}, el cliente acepta proporcionar datos reales para procesar el pedido, confirmar disponibilidad y coordinar la entrega.`,
    },
    {
      title: 'Precios y disponibilidad',
      body: 'Los precios, promociones y existencias pueden actualizarse sin previo aviso. Si un producto no está disponible después de la compra, se ofrecerá una alternativa, reprogramación o devolución según corresponda.',
    },
    {
      title: 'Confirmación del pedido',
      body: 'El pedido se considera recibido cuando la tienda genera la confirmación. La validación final puede depender del pago, datos de entrega y revisión operativa.',
    },
    {
      title: 'Responsabilidad',
      body: `${storeConfig.legalName} trabaja para mantener información precisa, pero puede corregir errores de precio, descripción o disponibilidad antes de completar la venta.`,
    },
  ],
  privacidad: [
    {
      title: 'Información que usamos',
      body: 'Podemos solicitar nombre, correo electrónico, teléfono, dirección de entrega y datos necesarios para gestionar compras, soporte y comunicación sobre pedidos.',
    },
    {
      title: 'Finalidad',
      body: 'Los datos se usan para crear cuentas, procesar pedidos, responder consultas, mejorar la experiencia de compra y cumplir obligaciones comerciales aplicables.',
    },
    {
      title: 'Protección',
      body: 'La tienda debe mantener credenciales, bases de datos y accesos administrativos protegidos. Los clientes pueden solicitar revisión o eliminación de sus datos a través del canal de soporte.',
    },
    {
      title: 'Terceros',
      body: 'Cuando existan proveedores de pago, envío o hosting, solo se comparte la información necesaria para completar el servicio solicitado por el cliente.',
    },
  ],
  devoluciones: [
    {
      title: 'Plazo de solicitud',
      body: 'Las solicitudes de cambio o devolución deben realizarse dentro del plazo comercial definido por la tienda, indicando número de pedido, motivo y evidencia cuando aplique.',
    },
    {
      title: 'Condición del producto',
      body: 'El producto debe conservar su estado original, accesorios y empaque cuando sea posible. Los daños por uso indebido pueden limitar la aprobación de la solicitud.',
    },
    {
      title: 'Revisión',
      body: 'Cada caso será revisado por soporte. La resolución puede ser cambio, reparación, crédito en tienda o devolución, según el producto y la condición verificada.',
    },
    {
      title: 'Costos de envío',
      body: 'Los costos de transporte para cambios o devoluciones pueden variar según la causa de la solicitud y la política acordada con cada cliente.',
    },
  ],
  envios: [
    {
      title: 'Cobertura',
      body: `${storeConfig.name} coordina entregas según la zona de cobertura configurada para cada cliente o negocio.`,
    },
    {
      title: 'Tiempos de entrega',
      body: 'Los tiempos pueden variar según disponibilidad, ubicación, método de envío y validación del pago. La tienda informará novedades relevantes durante el proceso.',
    },
    {
      title: 'Datos de entrega',
      body: 'El cliente es responsable de ingresar dirección, teléfono y referencias correctas. Si los datos son incompletos, el pedido puede retrasarse.',
    },
    {
      title: 'Recepción',
      body: 'Al recibir el pedido, se recomienda revisar el estado del producto y reportar cualquier novedad por los canales oficiales de soporte.',
    },
  ],
};

export function LegalPage() {
  const { policy } = useParams();
  const policyKey = isPolicyKey(policy) ? policy : 'terminos';
  const content = policyTitles[policyKey];
  const sections = policyKey === 'contacto' ? [] : policySections[policyKey];

  return (
    <section className="section legal-page">
      <div className="container">
        <div className="legal-hero">
          <span className="eyebrow">{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <small>Última actualización: 2026</small>
        </div>

        {policyKey === 'contacto' ? (
          <div className="legal-contact-grid">
            <ContactCard icon={<Mail size={22} />} label="Correo" value={storeConfig.supportEmail} href={`mailto:${storeConfig.supportEmail}`} />
            <ContactCard icon={<Phone size={22} />} label="Teléfono" value={storeConfig.supportPhone} href={`tel:${storeConfig.supportPhone.replace(/\s/g, '')}`} />
            <ContactCard icon={<MapPin size={22} />} label="Ubicación" value={storeConfig.location} />
          </div>
        ) : (
          <div className="legal-card">
            {sections.map((section) => (
              <article className="legal-section" key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        )}

        <div className="legal-note">
          <ShieldCheck size={20} />
          <p>
            Estas políticas sirven como referencia operativa para la tienda y pueden ajustarse según las condiciones comerciales de cada negocio.
            Para casos especiales, el equipo responsable puede actualizarlas antes de la publicación final.
          </p>
        </div>

        <div className="legal-links">
          <Link to="/legal/terminos">Términos</Link>
          <Link to="/legal/privacidad">Privacidad</Link>
          <Link to="/legal/devoluciones">Devoluciones</Link>
          <Link to="/legal/envios">Envíos</Link>
          <Link to="/legal/contacto">Contacto</Link>
        </div>
      </div>
    </section>
  );
}

function ContactCard({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <>
      {icon}
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </>
  );

  return href ? (
    <a className="legal-contact-card" href={href}>
      {content}
    </a>
  ) : (
    <div className="legal-contact-card">{content}</div>
  );
}

function isPolicyKey(policy: string | undefined): policy is PolicyKey {
  return policy === 'terminos' || policy === 'privacidad' || policy === 'devoluciones' || policy === 'envios' || policy === 'contacto';
}
