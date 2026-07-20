import { useState } from 'react';

const fallbackImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 700">
      <rect width="900" height="700" fill="#f1efea"/>
      <circle cx="450" cy="290" r="86" fill="#ff5a3d" opacity=".14"/>
      <rect x="255" y="365" width="390" height="32" rx="16" fill="#17191f" opacity=".12"/>
      <rect x="320" y="420" width="260" height="24" rx="12" fill="#17191f" opacity=".09"/>
      <text x="450" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="68" font-weight="800" fill="#ff5a3d">N</text>
      <text x="450" y="488" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#777b84">Imagen no disponible</text>
    </svg>
  `);

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
};

export function ProductImage({ src, alt, className, loading = 'lazy' }: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src || fallbackImage);

  return (
    <img
      className={className}
      src={imageSrc}
      alt={alt}
      loading={loading}
      onError={() => setImageSrc(fallbackImage)}
    />
  );
}
