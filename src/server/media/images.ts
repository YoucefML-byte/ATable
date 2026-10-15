import 'server-only';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createAdminClient } from '@/server/supabase/admin';
import { sniffImageType } from './sniff';

// Image pipeline (vol. 03 §8): real type check by reading the content, re-encoding to WebP by
// sharp (removes EXIF metadata, including geolocation), two sizes (400 and 1200 px), stored under
// shop-media/<shop_id>/<kind>/<uuid>-<size>.webp. Only the server writes (secret key).

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const BUCKET = 'shop-media';

export type ImageKind = 'products' | 'logo' | 'cover';

export class ImageError extends Error {
  constructor(public code: 'UNSUPPORTED_FILE' | 'PAYLOAD_TOO_LARGE') {
    super(code);
  }
}

/** Re-encodes and uploads; returns the base path (without the "-400.webp" suffix). */
export async function processAndStoreImage(
  shopId: string,
  kind: ImageKind,
  file: File,
): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageError('PAYLOAD_TOO_LARGE');
  const input = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(input);
  if (!type) throw new ImageError('UNSUPPORTED_FILE');
  const base = `${shopId}/${kind}/${randomUUID()}`;
  const admin = createAdminClient();
  const sizes = kind === 'logo' ? [400] : [400, 1200];
  try {
    for (const size of sizes) {
      // rotate() applies the EXIF orientation, then metadata is dropped (sharp's default).
      const output = await sharp(input, { failOn: 'error', limitInputPixels: 50_000_000 })
        .rotate()
        .resize({
          width: size,
          height: kind === 'products' ? Math.round((size * 3) / 4) : undefined,
          fit: kind === 'products' ? 'cover' : 'inside',
          withoutEnlargement: false,
        })
        .webp({ quality: 82 })
        .toBuffer();
      const { error } = await admin.storage.from(BUCKET).upload(`${base}-${size}.webp`, output, {
        contentType: 'image/webp',
        upsert: false,
        cacheControl: '31536000',
      });
      if (error) throw new Error(error.message);
    }
    if (kind === 'logo') {
      // The logo keeps a single size; the 1200 alias avoids a missing file.
      const { data } = await admin.storage.from(BUCKET).download(`${base}-400.webp`);
      if (data)
        await admin.storage
          .from(BUCKET)
          .upload(`${base}-1200.webp`, data, { contentType: 'image/webp', upsert: false });
    }
  } catch (e) {
    if (e instanceof ImageError) throw e;
    if (String(e).includes('unsupported image format') || String(e).includes('Input buffer'))
      throw new ImageError('UNSUPPORTED_FILE');
    throw e;
  }
  return base;
}

/** Removes the replaced files once the row has been updated. */
export async function deleteStoredImage(basePath: string | null): Promise<void> {
  if (!basePath) return;
  await createAdminClient()
    .storage.from(BUCKET)
    .remove([`${basePath}-400.webp`, `${basePath}-1200.webp`]);
}
