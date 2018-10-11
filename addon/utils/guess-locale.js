import { A as array } from '@ember/array';

/**
 * Guess a locale based on allowed & desired locales.
 * This will return the best-fitting locale.
 *
 * Given the following input:
 * allowedLocales = ['en', 'de', 'zh_HK']
 * desiredLocales = ['de-AT', 'de', 'en-US', 'en']
 *
 * It would by default return 'de'.
 *
 * If you specify `allowSubLocales=true`, it would instead return `de_AT`, the favorite sub-locale.
 *
 * In contrast, the following input:
 * allowedLocales = ['en', 'de', 'zh_HK']
 * desiredLocales = ['zh-CN', 'zh-HK', 'en-US', 'en']
 *
 * Would always return 'zh_HK', no matter if sub locales are allowed or not.
 *
 * @method guessLocale
 * @param allowedLocales
 * @param desiredLocales
 * @param defaultLocale
 * @param allowSubLocales
 * @return {String}
 */
export function guessLocale(allowedLocales = [], desiredLocales = [], { defaultLocale = 'en', allowSubLocales = false } = {}) {
  desiredLocales = desiredLocales || [defaultLocale];
  desiredLocales = desiredLocales.map(normalizeLocale).map(getLocalAlias);

  // Ensure everything is an Ember Array
  if (!desiredLocales.find) {
    desiredLocales = array(desiredLocales);
  }
  if (!allowedLocales.find) {
    allowedLocales = array(allowedLocales);
  }

  let locale = desiredLocales.find((locale) => {
    return allowedLocales.find((allowedLocale) => matchLocale(locale, allowedLocale));
  }) || defaultLocale;

  // If allowSubLocales=false, we do not want to return sub locales
  // For example, if 'de' is allowed, but the first matching locale is de_AT, it will return 'de' if true, else de_AT.
  if (allowSubLocales || allowedLocales.indexOf(locale) !== -1) {
    return locale;
  }

  return allowedLocales.find((allowedLocale) => locale.indexOf(allowedLocale) === 0) || defaultLocale;
}

export function normalizeLocale(locale) {
  locale = locale.replace('-', '_');
  let [mainLocale, region] = locale.split('_');
  if (region) {
    return `${mainLocale}_${region.toUpperCase()}`;
  }

  return mainLocale;
}

export function getLocalAlias(locale) {
  // There are variations of chinese locales
  // We need to map those to either Simplified (CN) or Traditional (HK).
  // Sadly, we cannot simply fall back to zh here, as that is not actually a valid locale
  switch (locale) {
    case 'zh_CN':
    case 'zh_SG':
    case 'zh_Hans':
    case 'zh':
      return 'zh_CN';
    case 'zh_HK':
    case 'zh_TW':
    case 'zh_MO':
    case 'zh_Hant':
      return 'zh_HK';
  }

  return locale;
}

export function matchLocale(localeA, localeB) {
  if (localeA === localeB) {
    return true;
  }

  return localeA.indexOf(localeB) === 0;
}

export default guessLocale;
