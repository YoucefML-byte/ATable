import { messages } from './messages';

// Each space only ships the messages it needs to the browser (4G budget, vol. 02 §14).
export const siteClientMessages = {
  common: messages.common,
  errors: messages.errors,
  site: messages.site,
};
export const proClientMessages = {
  common: messages.common,
  errors: messages.errors,
  pro: messages.pro,
};
export const consoleClientMessages = {
  common: messages.common,
  errors: messages.errors,
  console: messages.console,
  pro: messages.pro,
};
