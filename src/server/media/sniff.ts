// Pure helper (no server dependency) so that it can be unit-tested.

/** Detects the real format from the first bytes (the file name and declared type are ignored). */
export function sniffImageType(buf: Uint8Array): 'jpeg' | 'png' | 'webp' | 'heic' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  const ascii = (start: number, end: number) => String.fromCharCode(...buf.slice(start, end));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (ascii(4, 8) === 'ftyp' && ['heic', 'heix', 'mif1', 'msf1', 'heif'].includes(ascii(8, 12)))
    return 'heic';
  return null;
}
