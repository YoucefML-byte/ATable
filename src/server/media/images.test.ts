import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { sniffImageType } from './sniff';

describe('image type sniffing (vol. 05 M19)', () => {
  it('recognises real images', async () => {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#ff0000' } })
      .png()
      .toBuffer();
    const jpeg = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#00ff00' },
    })
      .jpeg()
      .toBuffer();
    const webp = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#0000ff' },
    })
      .webp()
      .toBuffer();
    expect(sniffImageType(png)).toBe('png');
    expect(sniffImageType(jpeg)).toBe('jpeg');
    expect(sniffImageType(webp)).toBe('webp');
  });
  it('refuses a non-image renamed .jpg', () => {
    expect(
      sniffImageType(new TextEncoder().encode('<script>alert(1)</script> not an image')),
    ).toBeNull();
    expect(
      sniffImageType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2, 3, 4, 5, 6, 7])),
    ).toBeNull(); // %PDF-
  });
  it('re-encoding drops the EXIF metadata (geolocation)', async () => {
    const withExif = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#888888' },
    })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: 'secret', ImageDescription: 'GPS 48.85,2.35' } } })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const out = await sharp(withExif).rotate().resize({ width: 4 }).webp().toBuffer();
    expect((await sharp(out).metadata()).exif).toBeUndefined();
  });
});
