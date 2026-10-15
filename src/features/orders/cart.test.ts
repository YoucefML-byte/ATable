import { describe, expect, it } from 'vitest';
import type { MenuProduct } from '@/features/catalog/menu-schema';
import {
  addLine,
  buildLine,
  cartTotalCents,
  combinedAllergens,
  defaultSelections,
  emptyCart,
  missingGroups,
  restoreCart,
  selectOption,
  setLineQuantity,
  toOrderPayload,
  unitPriceCents,
  CART_TTL_MS,
} from './cart';

const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

const tacos: MenuProduct = {
  id: uuid(1),
  name: 'Tacos 2 viandes',
  description: null,
  base_price_cents: 950,
  min_price_cents: 950,
  has_paid_options: true,
  image_path: null,
  tags: [],
  origin_info: null,
  is_sold_out: false,
  allergens_declared: true,
  allergens: [{ code: 'gluten', presence: 'contains' }],
  option_groups: [
    {
      id: uuid(10), name: 'Viandes', min: 2, max: 2, allow_quantity: false, max_per_option: 1,
      options: [
        { id: uuid(11), name: 'Poulet', price_delta_cents: 0, is_default: false, is_sold_out: false, allergens: [] },
        { id: uuid(12), name: 'Kebab', price_delta_cents: 0, is_default: false, is_sold_out: false, allergens: [] },
        { id: uuid(13), name: 'Cordon bleu', price_delta_cents: 0, is_default: false, is_sold_out: false, allergens: [{ code: 'milk', presence: 'contains' }] },
      ],
    },
    {
      id: uuid(20), name: 'Sauces', min: 0, max: 3, allow_quantity: false, max_per_option: 1,
      options: [
        { id: uuid(21), name: 'Algérienne', price_delta_cents: 0, is_default: false, is_sold_out: false, allergens: [{ code: 'eggs', presence: 'may_contain' }] },
        { id: uuid(22), name: 'Samouraï', price_delta_cents: 0, is_default: false, is_sold_out: false, allergens: [] },
        { id: uuid(23), name: 'Blanche', price_delta_cents: 0, is_default: false, is_sold_out: false, allergens: [] },
        { id: uuid(24), name: 'Harissa', price_delta_cents: 0, is_default: false, is_sold_out: true, allergens: [] },
        { id: uuid(25), name: 'Ketchup', price_delta_cents: 0, is_default: false, is_sold_out: false, allergens: [] },
      ],
    },
    {
      id: uuid(30), name: 'Taille', min: 1, max: 1, allow_quantity: false, max_per_option: 1,
      options: [
        { id: uuid(31), name: 'M', price_delta_cents: 0, is_default: true, is_sold_out: false, allergens: [] },
        { id: uuid(32), name: 'L', price_delta_cents: 150, is_default: false, is_sold_out: false, allergens: [] },
      ],
    },
    {
      id: uuid(40), name: 'Suppléments', min: 0, max: null, allow_quantity: true, max_per_option: 2,
      options: [{ id: uuid(41), name: 'Fromage', price_delta_cents: 100, is_default: false, is_sold_out: false, allergens: [] }],
    },
  ],
};

describe('product sheet rules (CLI-03)', () => {
  it('preselects default options', () => {
    expect(defaultSelections(tacos)[uuid(30)]).toEqual({ [uuid(31)]: 1 });
  });
  it('CA1 — cannot add without the mandatory meats', () => {
    let s = defaultSelections(tacos);
    expect(missingGroups(tacos, s)).toEqual([uuid(10)]);
    s = selectOption(tacos, s, uuid(10), uuid(11), 1);
    expect(missingGroups(tacos, s)).toEqual([uuid(10)]);
    s = selectOption(tacos, s, uuid(10), uuid(12), 1);
    expect(missingGroups(tacos, s)).toEqual([]);
  });
  it('CA2 — a 4th sauce is blocked when the maximum is 3', () => {
    let s = defaultSelections(tacos);
    for (const id of [21, 22, 23]) s = selectOption(tacos, s, uuid(20), uuid(id), 1);
    const blocked = selectOption(tacos, s, uuid(20), uuid(25), 1);
    expect(blocked).toBe(s);
  });
  it('a sold-out option cannot be selected', () => {
    const s = defaultSelections(tacos);
    expect(selectOption(tacos, s, uuid(20), uuid(24), 1)).toBe(s);
  });
  it('radio groups replace the choice', () => {
    let s = defaultSelections(tacos);
    s = selectOption(tacos, s, uuid(30), uuid(32), 1);
    expect(s[uuid(30)]).toEqual({ [uuid(32)]: 1 });
  });
  it('quantity options are capped by max_per_option', () => {
    let s = defaultSelections(tacos);
    s = selectOption(tacos, s, uuid(40), uuid(41), 5);
    expect(s[uuid(40)]).toEqual({ [uuid(41)]: 2 });
  });
  it('CA3 — price = (base + supplements) × quantity, same formula as the database', () => {
    let s = defaultSelections(tacos);
    s = selectOption(tacos, s, uuid(30), uuid(32), 1);
    s = selectOption(tacos, s, uuid(40), uuid(41), 2);
    expect(unitPriceCents(tacos, s)).toBe(950 + 150 + 200);
    const cart = addLine(emptyCart('shop', 't'), buildLine(tacos, s, 3));
    expect(cartTotalCents(cart)).toBe((950 + 150 + 200) * 3);
  });
  it('CA4 — allergens of chosen options are added', () => {
    let s = defaultSelections(tacos);
    s = selectOption(tacos, s, uuid(10), uuid(13), 1);
    s = selectOption(tacos, s, uuid(20), uuid(21), 1);
    expect(combinedAllergens(tacos, s)).toEqual({ contains: ['gluten', 'milk'], mayContain: ['eggs'] });
  });
});

describe('cart (CLI-04)', () => {
  it('merges identical lines and removes at quantity 0', () => {
    const s = selectOption(tacos, selectOption(tacos, defaultSelections(tacos), uuid(10), uuid(11), 1), uuid(10), uuid(12), 1);
    let cart = addLine(emptyCart('shop', 't'), buildLine(tacos, s, 1));
    cart = addLine(cart, buildLine(tacos, s, 2));
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]!.quantity).toBe(3);
    cart = setLineQuantity(cart, cart.lines[0]!.key, 0);
    expect(cart.lines).toHaveLength(0);
  });
  it('CA1 — a stored cart is restored; CA2 — emptied after 2 hours; another table empties it', () => {
    const now = 1_000_000_000;
    const stored = { ...emptyCart('shop', 't', now), lines: [buildLine(tacos, defaultSelections(tacos), 1)] };
    expect(restoreCart(stored, 'shop', 't', now + 1000).lines).toHaveLength(1);
    expect(restoreCart(stored, 'shop', 't', now + CART_TTL_MS + 1).lines).toHaveLength(0);
    expect(restoreCart(stored, 'shop', 'other', now + 1000).lines).toHaveLength(0);
  });
  it('the payload sent to the server contains no price', () => {
    const cart = addLine(emptyCart('shop', 't'), buildLine(tacos, defaultSelections(tacos), 1));
    const body = JSON.stringify(toOrderPayload(cart, uuid(99)));
    expect(body).not.toMatch(/price|cents|total/i);
  });
});
