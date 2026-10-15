import common from '../../messages/fr/common.json';
import errors from '../../messages/fr/errors.json';
import site from '../../messages/fr/site.json';
import pro from '../../messages/fr/pro.json';
import consoleMessages from '../../messages/fr/console.json';

// All interface texts (vol. 06 §1): one JSON file per space, merged into one catalogue.
export const messages = { common, errors, site, pro, console: consoleMessages };
export type Messages = typeof messages;
