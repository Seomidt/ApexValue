const translations: Record<string, Record<string, string>> = {
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
  },
  da: {
    "nav.dashboard": "Dashboard",
    "nav.auction_finder": "Auktionssøger",
    "nav.pipeline": "Pipeline",
    "nav.vat_tax": "Moms & Afgift",
    "nav.cost_templates": "Omkostningsskabeloner",
    "nav.settings": "Indstillinger",
    "nav.reports": "Rapporter",
    "nav.compare": "Sammenlign",
    "nav.admin": "Admin",
    "mode.demo": "Demo",
    "mode.live": "Live",
  },
};

let currentLang = "da";

export function setLanguage(lang: string) {
  currentLang = lang;
}

export function getLanguage(): string {
  return currentLang;
}

export function t(key: string): string {
  return translations[currentLang]?.[key] || translations["en"]?.[key] || key;
}

export function formatCurrency(amount: number, currency: string = "DKK"): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("da-DK").format(num);
}
