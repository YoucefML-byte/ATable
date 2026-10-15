// Values shared by the console forms and actions.
export const BUSINESS_TYPES = [
  'restaurant',
  'bar',
  'cafe',
  'tea_room',
  'bakery',
  'lounge',
  'food_court',
  'hotel',
  'other',
] as const;
export const FEATURES = ['nfc', 'multi_menu', 'analytics_export'] as const;
export const SHOP_STATUSES = ['onboarding', 'active', 'suspended', 'archived'] as const;
export const BILLING_STATUSES = ['trial', 'active', 'past_due', 'cancelled'] as const;
