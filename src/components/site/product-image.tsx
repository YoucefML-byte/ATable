/** Product photos are served by the storage CDN in two sizes (vol. 03 §8). */
export function ProductImage({
  path,
  base,
  alt,
  size,
  className,
}: {
  path: string;
  base: string;
  alt: string;
  size: 'small' | 'large';
  className?: string;
}) {
  const small = `${base}/${path}-400.webp`;
  const large = `${base}/${path}-1200.webp`;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- images come from the storage CDN, no Vercel optimisation
    <img
      src={size === 'small' ? small : large}
      srcSet={`${small} 400w, ${large} 1200w`}
      sizes={
        size === 'small' ? '(min-width: 640px) 200px, 33vw' : '(min-width: 640px) 512px, 100vw'
      }
      width={size === 'small' ? 400 : 1200}
      height={size === 'small' ? 400 : 900}
      loading="lazy"
      decoding="async"
      alt={alt}
      className={className}
    />
  );
}
