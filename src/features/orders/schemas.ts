import { z } from 'zod';

// POST /api/orders. `.strict()`: a body that contains a price (or any unknown field) is rejected
// (vol. 09 step 5, vol. 05 M2).
export const orderOptionInputSchema = z
  .object({
    option_id: z.uuid(),
    quantity: z.number().int().min(1).max(20),
  })
  .strict();

export const orderItemInputSchema = z
  .object({
    product_id: z.uuid(),
    quantity: z.number().int().min(1).max(200),
    options: z.array(orderOptionInputSchema).max(50),
  })
  .strict();

export const placeOrderInputSchema = z
  .object({
    idempotencyKey: z.uuid(),
    note: z.string().max(280).nullable(),
    items: z.array(orderItemInputSchema).min(1).max(200),
  })
  .strict();

export type PlaceOrderInput = z.infer<typeof placeOrderInputSchema>;

export const placeOrderResultSchema = z.object({
  order_id: z.uuid(),
  number: z.number().int(),
  subtotal_cents: z.number().int(),
  item_count: z.number().int(),
  duplicate: z.boolean(),
});
export type PlaceOrderResult = z.infer<typeof placeOrderResultSchema>;

export const myOrderSchema = z.object({
  order_id: z.uuid(),
  number: z.number().int(),
  created_at: z.string(),
  status: z.enum(['sent', 'withdrawn']),
  subtotal_cents: z.number().int(),
  note: z.string().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().int(),
      line_total_cents: z.number().int(),
      options: z.array(z.object({ name: z.string(), quantity: z.number().int() })),
    }),
  ),
});
export type MyOrder = z.infer<typeof myOrderSchema>;

export const ORDER_STATUSES = [
  'submitted',
  'accepted',
  'ready',
  'served',
  'rejected',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const REJECT_REASONS = ['nobody', 'duplicate', 'unavailable', 'other'] as const;
export const CANCEL_REASONS = ['left', 'mistake', 'unavailable', 'other'] as const;

export const transitionInputSchema = z
  .object({
    shopSlug: z.string().min(1).max(40),
    orderId: z.uuid(),
    to: z.enum(['accepted', 'rejected', 'ready', 'served', 'cancelled']),
    reason: z.string().trim().max(200).nullable(),
  })
  .strict();
