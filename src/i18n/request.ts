import { getRequestConfig } from 'next-intl/server';
import { messages } from './messages';

// French only at launch; architecture ready for other languages (vol. 03 §3, vol. 09 §4.3).
export default getRequestConfig(async () => ({
  locale: 'fr',
  timeZone: 'Europe/Paris',
  messages,
}));
