import { z } from 'zod';
import { ALLERGEN_CODES, PRODUCT_TAGS } from './menu-schema';

// Catalog forms (CAT-01 to CAT-03). Same limits as the SQL constraints (vol. 05 §7).

const slug = z.string().min(1).max(40);
const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length === 0 ? null : v))
    .nullable();

export const categoryInputSchema = z
  .object({
    shopSlug: slug,
    id: z.uuid().nullable(),
    name: z.string().trim().min(1).max(60),
    description: nullableText(300),
    prepStation: z.enum(['kitchen', 'bar', 'none']),
    isHidden: z.boolean(),
    isSoldOut: z.boolean(),
    menuIds: z.array(z.uuid()).max(50),
  })
  .strict();

export const productGroupLinkSchema = z
  .object({
    groupId: z.uuid(),
    minOverride: z.number().int().min(0).max(50).nullable(),
    maxOverride: z.number().int().min(1).max(50).nullable(),
  })
  .strict()
  .refine(
    (v) => v.minOverride === null || v.maxOverride === null || v.minOverride <= v.maxOverride,
    { message: 'minGreaterThanMax' },
  );

export const productInputSchema = z
  .object({
    shopSlug: slug,
    id: z.uuid().nullable(),
    categoryId: z.uuid(),
    name: z.string().trim().min(1).max(80),
    description: nullableText(500),
    basePriceCents: z.number().int().min(0).max(1_000_000),
    tags: z.array(z.enum(PRODUCT_TAGS)).max(7),
    originInfo: nullableText(200),
    isHidden: z.boolean(),
    isSoldOut: z.boolean(),
    groups: z.array(productGroupLinkSchema).max(20),
    template: z.enum(['simple', 'sizes', 'compose']).optional(),
  })
  .strict();

export const groupInputSchema = z
  .object({
    shopSlug: slug,
    id: z.uuid().nullable(),
    name: z.string().trim().min(1).max(60),
    internalName: nullableText(60),
    minSelect: z.number().int().min(0).max(50),
    maxSelect: z.number().int().min(1).max(50).nullable(),
    allowQuantity: z.boolean(),
    maxPerOption: z.number().int().min(1).max(20),
    isHidden: z.boolean(),
  })
  .strict()
  .refine((v) => v.maxSelect === null || v.minSelect <= v.maxSelect, {
    path: ['maxSelect'],
    message: 'minGreaterThanMax',
  });

export const optionInputSchema = z
  .object({
    shopSlug: slug,
    id: z.uuid().nullable(),
    groupId: z.uuid(),
    name: z.string().trim().min(1).max(60),
    priceDeltaCents: z.number().int().min(0).max(100_000),
    isDefault: z.boolean(),
    isHidden: z.boolean(),
    isSoldOut: z.boolean(),
  })
  .strict();

export const allergensInputSchema = z
  .object({
    shopSlug: slug,
    kind: z.enum(['product', 'option']),
    id: z.uuid(),
    none: z.boolean(),
    allergens: z
      .array(
        z
          .object({ code: z.enum(ALLERGEN_CODES), presence: z.enum(['contains', 'may_contain']) })
          .strict(),
      )
      .max(14),
  })
  .strict();

export type CategoryInput = z.input<typeof categoryInputSchema>;
export type ProductInput = z.input<typeof productInputSchema>;
export type GroupInput = z.input<typeof groupInputSchema>;
export type OptionInput = z.input<typeof optionInputSchema>;
export type AllergensInput = z.input<typeof allergensInputSchema>;
