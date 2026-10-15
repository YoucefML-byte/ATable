// Cart logic shared by the product sheet and the cart (vol. 02 CLI-03, CLI-04).
// The price shown here must equal, to the cent, the price computed by the database (CLI-03 CA3):
// unit = base + Σ(option delta × option quantity); line = unit × quantity.
import type { AllergenCode, Menu, MenuGroup, MenuProduct } from '@/features/catalog/menu-schema';

/** option id → quantity, per group id */
export type Selections = Record<string, Record<string, number>>;

export type CartLine = {
  key: string; // product + options, used to merge identical lines
  productId: string;
  name: string;
  quantity: number;
  options: Array<{
    optionId: string;
    groupId: string;
    name: string;
    quantity: number;
    priceDeltaCents: number;
  }>;
  basePriceCents: number;
  unavailable?: boolean;
};

export type Cart = {
  shopId: string;
  table: string; // table token prefix (identifies the table, not displayed)
  createdAt: number;
  lines: CartLine[];
  note: string;
};

export const CART_TTL_MS = 2 * 60 * 60 * 1000; // CLI-04 CA2: carts older than 2 hours are emptied
export const MAX_NOTE_LENGTH = 280;

export function effectiveMax(group: Pick<MenuGroup, 'max'>): number {
  return group.max ?? Number.POSITIVE_INFINITY;
}

/** Initial selections: options marked "default" (if orderable). */
export function defaultSelections(product: MenuProduct): Selections {
  const out: Selections = {};
  for (const group of product.option_groups) {
    out[group.id] = {};
    let count = 0;
    for (const option of group.options) {
      if (option.is_default && !option.is_sold_out && count < effectiveMax(group)) {
        out[group.id]![option.id] = 1;
        count++;
      }
    }
  }
  return out;
}

export function groupCount(selections: Selections, groupId: string): number {
  return Object.values(selections[groupId] ?? {}).reduce((a, b) => a + b, 0);
}

/** Groups whose minimum is not reached (the "Add" button stays disabled). */
export function missingGroups(product: MenuProduct, selections: Selections): string[] {
  return product.option_groups.filter((g) => groupCount(selections, g.id) < g.min).map((g) => g.id);
}

/** Toggles or sets an option according to the group's rules (radio, checkbox, quantity). */
export function selectOption(
  product: MenuProduct,
  selections: Selections,
  groupId: string,
  optionId: string,
  quantity: number,
): Selections {
  const group = product.option_groups.find((g) => g.id === groupId);
  const option = group?.options.find((o) => o.id === optionId);
  if (!group || !option || option.is_sold_out) return selections;
  const current = { ...(selections[groupId] ?? {}) };
  const max = effectiveMax(group);
  const q = Math.max(0, Math.min(quantity, group.allow_quantity ? group.max_per_option : 1));
  if (max === 1 && !group.allow_quantity) {
    // Radio behaviour: replaces the current choice (or clears it when optional and re-clicked).
    const next = q > 0 ? { [optionId]: 1 } : {};
    return { ...selections, [groupId]: next };
  }
  const others = Object.entries(current)
    .filter(([id]) => id !== optionId)
    .reduce((a, [, n]) => a + n, 0);
  if (q === 0) delete current[optionId];
  else if (others + q <= max) current[optionId] = q;
  else return selections; // blocked once the maximum is reached (CLI-03 CA2)
  return { ...selections, [groupId]: current };
}

export function unitPriceCents(product: MenuProduct, selections: Selections): number {
  let unit = product.base_price_cents;
  for (const group of product.option_groups) {
    for (const option of group.options) {
      unit += option.price_delta_cents * (selections[group.id]?.[option.id] ?? 0);
    }
  }
  return unit;
}

export function linePriceCents(
  line: Pick<CartLine, 'basePriceCents' | 'options' | 'quantity'>,
): number {
  const unit =
    line.basePriceCents + line.options.reduce((a, o) => a + o.priceDeltaCents * o.quantity, 0);
  return unit * line.quantity;
}

export function cartTotalCents(cart: Pick<Cart, 'lines'>): number {
  return cart.lines.reduce((a, l) => a + linePriceCents(l), 0);
}

export function cartCount(cart: Pick<Cart, 'lines'>): number {
  return cart.lines.reduce((a, l) => a + l.quantity, 0);
}

/** Allergens of the product plus those of the chosen options (CLI-03 CA4). */
export function combinedAllergens(
  product: MenuProduct,
  selections: Selections,
): { contains: AllergenCode[]; mayContain: AllergenCode[] } {
  const contains = new Set<string>();
  const may = new Set<string>();
  const add = (list: Array<{ code: string; presence: string }>) => {
    for (const a of list) (a.presence === 'contains' ? contains : may).add(a.code);
  };
  add(product.allergens);
  for (const group of product.option_groups) {
    for (const option of group.options) {
      if ((selections[group.id]?.[option.id] ?? 0) > 0) add(option.allergens);
    }
  }
  for (const c of contains) may.delete(c);
  return { contains: [...contains] as AllergenCode[], mayContain: [...may] as AllergenCode[] };
}

export function buildLine(
  product: MenuProduct,
  selections: Selections,
  quantity: number,
): CartLine {
  const options: CartLine['options'] = [];
  for (const group of product.option_groups) {
    for (const option of group.options) {
      const q = selections[group.id]?.[option.id] ?? 0;
      if (q > 0) {
        options.push({
          optionId: option.id,
          groupId: group.id,
          name: option.name,
          quantity: q,
          priceDeltaCents: option.price_delta_cents,
        });
      }
    }
  }
  const key = `${product.id}|${options
    .map((o) => `${o.optionId}x${o.quantity}`)
    .sort()
    .join(',')}`;
  return {
    key,
    productId: product.id,
    name: product.name,
    quantity,
    options,
    basePriceCents: product.base_price_cents,
  };
}

export function addLine(cart: Cart, line: CartLine): Cart {
  const existing = cart.lines.find((l) => l.key === line.key);
  if (existing) {
    return {
      ...cart,
      lines: cart.lines.map((l) =>
        l.key === line.key ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l,
      ),
    };
  }
  return { ...cart, lines: [...cart.lines, line] };
}

export function setLineQuantity(cart: Cart, key: string, quantity: number): Cart {
  if (quantity <= 0) return { ...cart, lines: cart.lines.filter((l) => l.key !== key) };
  return {
    ...cart,
    lines: cart.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, quantity) } : l)),
  };
}

export function emptyCart(shopId: string, table: string, now = Date.now()): Cart {
  return { shopId, table, createdAt: now, lines: [], note: '' };
}

/** Restores a stored cart if it belongs to the same shop and table and is less than 2 h old. */
export function restoreCart(raw: unknown, shopId: string, table: string, now = Date.now()): Cart {
  const fresh = emptyCart(shopId, table, now);
  if (!raw || typeof raw !== 'object') return fresh;
  const c = raw as Partial<Cart>;
  if (c.shopId !== shopId || c.table !== table) return fresh; // CLI-04: another table empties the cart
  if (typeof c.createdAt !== 'number' || now - c.createdAt > CART_TTL_MS) return fresh;
  if (!Array.isArray(c.lines)) return fresh;
  return {
    ...fresh,
    createdAt: c.createdAt,
    lines: c.lines as CartLine[],
    note: typeof c.note === 'string' ? c.note.slice(0, MAX_NOTE_LENGTH) : '',
  };
}

/** Marks lines whose product or options are no longer orderable in the current menu. */
export function markUnavailable(cart: Cart, menu: Menu, productId?: string): Cart {
  const products = new Map(
    menu.categories.flatMap((c) => c.products.map((p) => [p.id, p] as const)),
  );
  return {
    ...cart,
    lines: cart.lines.map((l) => {
      const p = products.get(l.productId);
      const optionsOk = l.options.every((o) =>
        p?.option_groups.some((g) =>
          g.options.some((opt) => opt.id === o.optionId && !opt.is_sold_out),
        ),
      );
      const unavailable = !p || p.is_sold_out || !optionsOk || l.productId === productId;
      return { ...l, unavailable };
    }),
  };
}

/** Body of POST /api/orders: identifiers and quantities only, never a price (CLI-05). */
export function toOrderPayload(cart: Cart, idempotencyKey: string) {
  return {
    idempotencyKey,
    note: cart.note.trim().length > 0 ? cart.note.trim().slice(0, MAX_NOTE_LENGTH) : null,
    items: cart.lines.map((l) => ({
      product_id: l.productId,
      quantity: l.quantity,
      options: l.options.map((o) => ({ option_id: o.optionId, quantity: o.quantity })),
    })),
  };
}
