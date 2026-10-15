import QRCode from 'qrcode';

// QR code drawn as React SVG elements (no innerHTML, vol. 05 rules). Works on the server and in
// the browser: the module matrix comes from the qrcode library, the drawing is ours.
export function qrPath(text: string): { size: number; d: string } {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const { size, data } = qr.modules;
  let d = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) if (data[y * size + x]) d += `M${x} ${y}h1v1h-1z`;
  }
  return { size, d };
}

export function QrCode({
  value,
  label,
  className,
  margin = 2,
}: {
  value: string;
  label: string;
  className?: string;
  margin?: number;
}) {
  const { size, d } = qrPath(value);
  const box = size + margin * 2;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${-margin} ${-margin} ${box} ${box}`}
      role="img"
      aria-label={label}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect x={-margin} y={-margin} width={box} height={box} fill="#FFFFFF" />
      <path d={d} fill="#000000" />
    </svg>
  );
}

/** Standalone SVG file content, for the "download SVG" button. */
export function qrSvgFile(value: string, margin = 2): string {
  const { size, d } = qrPath(value);
  const box = size + margin * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-margin} ${-margin} ${box} ${box}" shape-rendering="crispEdges"><rect x="${-margin}" y="${-margin}" width="${box}" height="${box}" fill="#FFFFFF"/><path d="${d}" fill="#000000"/></svg>`;
}
