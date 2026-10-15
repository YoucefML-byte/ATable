'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { removeProductPhotoAction, uploadProductPhotoAction } from '@/features/catalog/actions';
import { Alert, Button } from '@/components/ui/primitives';

const MAX_SIDE = 2000;

/**
 * Reduces the photo in the browser before sending it (vol. 03 §8): a 12-megapixel phone photo
 * would otherwise exceed the request limit. The server re-encodes anyway (type check, EXIF).
 */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 3 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.9),
    );
    return blob ?? file;
  } catch {
    // Format the browser cannot decode: the server decides.
    return file;
  }
}

export function PhotoUpload({
  shopSlug,
  productId,
  imageUrl,
  onChanged,
}: {
  shopSlug: string;
  productId: string;
  imageUrl: string | null;
  onChanged: () => void;
}) {
  const t = useTranslations('pro.catalog.photo');
  const te = useTranslations('errors');
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setPending(true);
    setError(null);
    const blob = await shrink(file);
    const form = new FormData();
    form.set('shopSlug', shopSlug);
    form.set('productId', productId);
    form.set('file', new File([blob], 'photo', { type: blob.type || file.type }));
    const res = await uploadProductPhotoAction(form);
    setPending(false);
    if (input.current) input.current.value = '';
    if (!res.ok) setError(te(res.code));
    else onChanged();
  }

  async function remove() {
    setPending(true);
    const res = await removeProductPhotoAction(shopSlug, productId);
    setPending(false);
    if (!res.ok) setError(te(res.code));
    else onChanged();
  }

  return (
    <div className="space-y-2">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- storage CDN image
        <img
          src={imageUrl}
          alt=""
          width={400}
          height={300}
          className="aspect-[4/3] w-full max-w-xs rounded-lg object-cover"
        />
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        id={`photo-${productId}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={pending} onClick={() => input.current?.click()}>
          {pending ? t('uploading') : imageUrl ? t('replace') : t('choose')}
        </Button>
        {imageUrl && (
          <Button variant="ghost" disabled={pending} onClick={remove}>
            {t('remove')}
          </Button>
        )}
      </div>
      <p className="text-muted text-sm">{t('help')}</p>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
