import { en } from './en';
import { da } from './da';
import type { I18n } from './en';

export type SupportedLocale = 'en' | 'da';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const locales: Record<SupportedLocale, I18n> = { en, da: da as unknown as I18n };

export function getT(locale: SupportedLocale = 'en'): I18n {
  return locales[locale] ?? en;
}

export type { I18n };
