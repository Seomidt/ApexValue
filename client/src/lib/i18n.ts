import { createContext, useContext } from "react";

export type SupportedLanguage = "da" | "en" | "de" | "nl" | "sv" | "no" | "pl" | "fr";

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  da: "Dansk",
  en: "English",
  de: "Deutsch",
  nl: "Nederlands",
  sv: "Svenska",
  no: "Norsk",
  pl: "Polski",
  fr: "Fran\u00e7ais",
};

const translations: Record<string, Record<string, string>> = {
  da: {
    "nav.dashboard": "Dashboard",
    "nav.auction_finder": "Auktionss\u00f8ger",
    "nav.pipeline": "Pipeline",
    "nav.vat_tax": "Moms & Afgift",
    "nav.cost_templates": "Omkostningsskabeloner",
    "nav.settings": "Indstillinger",
    "nav.reports": "Rapporter",
    "nav.compare": "Sammenlign",
    "nav.admin": "Admin",
    "mode.demo": "Demo",
    "mode.live": "Live",
    "common.save": "Gem",
    "common.cancel": "Annuller",
    "common.search": "S\u00f8g",
    "common.filter": "Filtrer",
    "common.all": "Alle",
    "common.details": "Detaljer",
    "common.delete": "Slet",
    "common.edit": "Rediger",
    "common.close": "Luk",
    "common.loading": "Indl\u00e6ser...",
    "common.no_results": "Ingen resultater",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.auction_finder": "Auction Finder",
    "nav.pipeline": "Pipeline",
    "nav.vat_tax": "VAT & Tax",
    "nav.cost_templates": "Cost Templates",
    "nav.settings": "Settings",
    "nav.reports": "Reports",
    "nav.compare": "Compare",
    "nav.admin": "Admin",
    "mode.demo": "Demo",
    "mode.live": "Live",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.all": "All",
    "common.details": "Details",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.loading": "Loading...",
    "common.no_results": "No results",
  },
  de: {
    "nav.dashboard": "Dashboard",
    "nav.auction_finder": "Auktionssuche",
    "nav.pipeline": "Pipeline",
    "nav.vat_tax": "MwSt & Steuer",
    "nav.cost_templates": "Kostenvorlagen",
    "nav.settings": "Einstellungen",
    "nav.reports": "Berichte",
    "nav.compare": "Vergleichen",
    "nav.admin": "Admin",
    "mode.demo": "Demo",
    "mode.live": "Live",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.search": "Suchen",
    "common.filter": "Filtern",
    "common.all": "Alle",
    "common.details": "Details",
    "common.delete": "L\u00f6schen",
    "common.edit": "Bearbeiten",
    "common.close": "Schlie\u00dfen",
    "common.loading": "Laden...",
    "common.no_results": "Keine Ergebnisse",
  },
  nl: {
    "nav.dashboard": "Dashboard",
    "nav.auction_finder": "Veiling Zoeker",
    "nav.pipeline": "Pipeline",
    "nav.vat_tax": "BTW & Belasting",
    "nav.cost_templates": "Kostensjablonen",
    "nav.settings": "Instellingen",
    "nav.reports": "Rapporten",
    "nav.compare": "Vergelijken",
    "nav.admin": "Admin",
    "mode.demo": "Demo",
    "mode.live": "Live",
    "common.save": "Opslaan",
    "common.cancel": "Annuleren",
    "common.search": "Zoeken",
    "common.filter": "Filteren",
    "common.all": "Alle",
    "common.details": "Details",
    "common.delete": "Verwijderen",
    "common.edit": "Bewerken",
    "common.close": "Sluiten",
    "common.loading": "Laden...",
    "common.no_results": "Geen resultaten",
  },
  sv: {
    "nav.dashboard": "Dashboard",
    "nav.auction_finder": "Auktionss\u00f6kare",
    "nav.pipeline": "Pipeline",
    "nav.vat_tax": "Moms & Skatt",
    "nav.cost_templates": "Kostnadsmallar",
    "nav.settings": "Inst\u00e4llningar",
    "nav.reports": "Rapporter",
    "nav.compare": "J\u00e4mf\u00f6r",
    "nav.admin": "Admin",
    "mode.demo": "Demo",
    "mode.live": "Live",
    "common.save": "Spara",
    "common.cancel": "Avbryt",
    "common.search": "S\u00f6k",
    "common.filter": "Filtrera",
    "common.all": "Alla",
    "common.details": "Detaljer",
    "common.delete": "Radera",
    "common.edit": "Redigera",
    "common.close": "St\u00e4ng",
    "common.loading": "Laddar...",
    "common.no_results": "Inga resultat",
  },
  no: {
    "nav.dashboard": "Dashboard",
    "nav.auction_finder": "Auksjonsøker",
    "nav.pipeline": "Pipeline",
    "nav.vat_tax": "MVA & Avgift",
    "nav.cost_templates": "Kostnadsmaler",
    "nav.settings": "Innstillinger",
    "nav.reports": "Rapporter",
    "nav.compare": "Sammenlign",
    "nav.admin": "Admin",
    "mode.demo": "Demo",
    "mode.live": "Live",
    "common.save": "Lagre",
    "common.cancel": "Avbryt",
    "common.search": "S\u00f8k",
    "common.filter": "Filtrer",
    "common.all": "Alle",
    "common.details": "Detaljer",
    "common.delete": "Slett",
    "common.edit": "Rediger",
    "common.close": "Lukk",
    "common.loading": "Laster...",
    "common.no_results": "Ingen resultater",
  },
  pl: {
    "nav.dashboard": "Panel",
    "nav.auction_finder": "Wyszukiwarka aukcji",
    "nav.pipeline": "Pipeline",
    "nav.vat_tax": "VAT & Podatki",
    "nav.cost_templates": "Szablony koszt\u00f3w",
    "nav.settings": "Ustawienia",
    "nav.reports": "Raporty",
    "nav.compare": "Por\u00f3wnaj",
    "nav.admin": "Admin",
    "mode.demo": "Demo",
    "mode.live": "Live",
    "common.save": "Zapisz",
    "common.cancel": "Anuluj",
    "common.search": "Szukaj",
    "common.filter": "Filtruj",
    "common.all": "Wszystkie",
    "common.details": "Szczeg\u00f3\u0142y",
    "common.delete": "Usu\u0144",
    "common.edit": "Edytuj",
    "common.close": "Zamknij",
    "common.loading": "\u0141adowanie...",
    "common.no_results": "Brak wynik\u00f3w",
  },
  fr: {
    "nav.dashboard": "Tableau de bord",
    "nav.auction_finder": "Recherche ench\u00e8res",
    "nav.pipeline": "Pipeline",
    "nav.vat_tax": "TVA & Imp\u00f4ts",
    "nav.cost_templates": "Mod\u00e8les de co\u00fbts",
    "nav.settings": "Param\u00e8tres",
    "nav.reports": "Rapports",
    "nav.compare": "Comparer",
    "nav.admin": "Admin",
    "mode.demo": "D\u00e9mo",
    "mode.live": "Live",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.all": "Tous",
    "common.details": "D\u00e9tails",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.close": "Fermer",
    "common.loading": "Chargement...",
    "common.no_results": "Aucun r\u00e9sultat",
  },
};

let currentLang: SupportedLanguage = (localStorage.getItem("apexvalue_language") as SupportedLanguage) || "da";

export function setLanguage(lang: SupportedLanguage) {
  currentLang = lang;
  localStorage.setItem("apexvalue_language", lang);
}

export function getLanguage(): SupportedLanguage {
  return currentLang;
}

export function t(key: string): string {
  return translations[currentLang]?.[key] || translations["da"]?.[key] || translations["en"]?.[key] || key;
}

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "da",
  setLanguage: () => {},
  t,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function formatCurrency(amount: number, currency: string = "DKK"): string {
  const locale = currentLang === "da" || currentLang === "no" ? "da-DK" : currentLang === "de" ? "de-DE" : currentLang === "fr" ? "fr-FR" : currentLang === "nl" ? "nl-NL" : currentLang === "sv" ? "sv-SE" : currentLang === "pl" ? "pl-PL" : "da-DK";
  return new Intl.NumberFormat(locale, {
    style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  const locale = currentLang === "da" || currentLang === "no" ? "da-DK" : currentLang === "de" ? "de-DE" : currentLang === "fr" ? "fr-FR" : currentLang === "nl" ? "nl-NL" : currentLang === "sv" ? "sv-SE" : currentLang === "pl" ? "pl-PL" : "da-DK";
  return new Intl.NumberFormat(locale).format(num);
}
