// ─── ApexValue Core Calculation Engine ───────────────────────────────────────
// All functions are deterministic and pure for testability.

export interface CostItem {
  category: string;
  label: string;
  amountEur: number;
  included: boolean;
}

export interface VATSchemeResult {
  scheme: 'margin' | 'reverse_charge' | 'standard' | 'private';
  buyPrice: number;
  buyVAT: number;
  sellPrice: number;
  sellVAT: number;
  margin: number;
  vatOnMargin: number;
  netVATPayable: number;
  vatReturn: number;
  capitalBinding: 'minimal' | 'medium' | 'high';
  capitalBindingEur: number;
}

export interface ProfitResult {
  totalCost: number;
  breakEven: number;
  conservativeSell: number;
  normalSell: number;
  optimisticSell: number;
  conservativeProfit: number;
  normalProfit: number;
  optimisticProfit: number;
  conservativeROI: number;
  normalROI: number;
  optimisticROI: number;
  maxBidSafe: number;
  maxBidBalanced: number;
  maxBidAggressive: number;
}

export interface DealScoreResult {
  total: number;
  priceVsMarket: number;
  profitROI: number;
  taxVATCertainty: number;
  sellability: number;
  dataQuality: number;
  breakdown: string[];
  riskBadges: string[];
  recommendation: 'BUY' | 'CONSIDER' | 'DROP';
}

// ─── Total Cost ───────────────────────────────────────────────────────────────
export function calcTotalCost(
  buyPrice: number,
  costs: CostItem[],
  vatReturn: number = 0
): number {
  const includedCosts = costs
    .filter((c) => c.included)
    .reduce((sum, c) => sum + c.amountEur, 0);
  return Math.max(0, buyPrice + includedCosts - vatReturn);
}

// ─── VAT Schemes ─────────────────────────────────────────────────────────────
const DK_VAT_RATE = 0.25;
const EU_VAT_RATE = 0.19; // DE standard

export function calcVATScheme(
  scheme: VATSchemeResult['scheme'],
  buyPriceExVAT: number,
  sellPriceExVAT: number,
  buyVATRate: number = EU_VAT_RATE
): VATSchemeResult {
  let buyVAT = 0;
  let sellVAT = 0;
  let margin = 0;
  let vatOnMargin = 0;
  let netVATPayable = 0;
  let vatReturn = 0;

  switch (scheme) {
    case 'reverse_charge':
      // B2B cross-border: no VAT on purchase, 0% on sale
      buyVAT = 0;
      sellVAT = 0;
      netVATPayable = 0;
      vatReturn = 0;
      break;

    case 'margin':
      // Margin scheme: VAT only on profit margin
      buyVAT = 0; // included in buy price, not reclaimable
      margin = sellPriceExVAT - buyPriceExVAT;
      vatOnMargin = Math.max(0, margin * DK_VAT_RATE);
      sellVAT = vatOnMargin;
      netVATPayable = vatOnMargin;
      break;

    case 'standard':
      // Full VAT: reclaim input VAT, collect output VAT
      buyVAT = buyPriceExVAT * buyVATRate;
      sellVAT = sellPriceExVAT * DK_VAT_RATE;
      vatReturn = buyVAT;
      netVATPayable = sellVAT - vatReturn;
      break;

    case 'private':
      // Private purchase: no input VAT recoverable
      buyVAT = 0;
      sellVAT = sellPriceExVAT * DK_VAT_RATE;
      netVATPayable = sellVAT;
      break;
  }

  // Capital binding = cash tied up in VAT before recovery
  const capitalBindingEur =
    scheme === 'standard' ? buyVAT : scheme === 'margin' ? vatOnMargin * 0.5 : 0;
  const capitalBinding =
    capitalBindingEur < 500
      ? 'minimal'
      : capitalBindingEur < 3000
      ? 'medium'
      : 'high';

  return {
    scheme,
    buyPrice: buyPriceExVAT,
    buyVAT,
    sellPrice: sellPriceExVAT,
    sellVAT,
    margin,
    vatOnMargin,
    netVATPayable,
    vatReturn,
    capitalBinding,
    capitalBindingEur,
  };
}

// ─── Comps Statistics ─────────────────────────────────────────────────────────
export interface CompStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
  stdDev: number;
}

export function calcCompStats(prices: number[]): CompStats {
  if (!prices.length) {
    return { count: 0, min: 0, max: 0, mean: 0, median: 0, p25: 0, p75: 0, stdDev: 0 };
  }
  const sorted = [...prices].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, p) => s + p, 0) / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const p25 = sorted[Math.floor(n * 0.25)];
  const p75 = sorted[Math.floor(n * 0.75)];
  const variance = sorted.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  return { count: n, min: sorted[0], max: sorted[n - 1], mean, median, p25, p75, stdDev };
}

// ─── Profit Scenarios ────────────────────────────────────────────────────────
export function calcProfitScenarios(
  totalCost: number,
  stats: CompStats,
  profitBuffer = { safe: 2000, balanced: 1000, aggressive: 500 }
): ProfitResult {
  const conservative = stats.p25 || stats.mean * 0.9;
  const normal = stats.median || stats.mean;
  const optimistic = stats.p75 || stats.mean * 1.1;

  const cProfit = conservative - totalCost;
  const nProfit = normal - totalCost;
  const oProfit = optimistic - totalCost;

  return {
    totalCost,
    breakEven: totalCost,
    conservativeSell: conservative,
    normalSell: normal,
    optimisticSell: optimistic,
    conservativeProfit: cProfit,
    normalProfit: nProfit,
    optimisticProfit: oProfit,
    conservativeROI: totalCost > 0 ? cProfit / totalCost : 0,
    normalROI: totalCost > 0 ? nProfit / totalCost : 0,
    optimisticROI: totalCost > 0 ? oProfit / totalCost : 0,
    maxBidSafe: Math.max(0, conservative - profitBuffer.safe - (totalCost - 0)), // totalCost excluding buy
    maxBidBalanced: Math.max(0, normal - profitBuffer.balanced - (totalCost - 0)),
    maxBidAggressive: Math.max(0, optimistic - profitBuffer.aggressive - (totalCost - 0)),
  };
}

export function calcMaxBid(
  targetSell: number,
  otherCosts: number, // all costs except buy price
  desiredProfit: number
): number {
  return Math.max(0, targetSell - otherCosts - desiredProfit);
}

// ─── Deal Score ───────────────────────────────────────────────────────────────
export function calcDealScore(params: {
  buyPrice: number;
  compStats: CompStats;
  profit: number;
  roi: number;
  taxKnown: boolean;
  vatSchemeKnown: boolean;
  mileageKm: number;
  compCount: number;
  hasDamage?: boolean;
  capitalBinding?: 'minimal' | 'medium' | 'high';
}): DealScoreResult {
  const badges: string[] = [];
  const breakdown: string[] = [];
  let total = 0;

  // 1. Price vs market (0–40 pts)
  let priceScore = 0;
  if (params.compStats.count >= 3) {
    const pct = params.buyPrice / params.compStats.median;
    if (pct < 0.7) { priceScore = 40; breakdown.push('Excellent price vs market'); }
    else if (pct < 0.85) { priceScore = 32; breakdown.push('Good price vs market'); }
    else if (pct < 0.95) { priceScore = 22; breakdown.push('Fair price vs market'); }
    else if (pct < 1.05) { priceScore = 10; breakdown.push('At market price'); }
    else { priceScore = 0; breakdown.push('Above market price'); badges.push('HIGH_PRICE'); }
  } else {
    priceScore = 15;
    badges.push('LOW_COMPS');
    breakdown.push('Insufficient comps data');
  }
  total += priceScore;

  // 2. Profit/ROI (0–30 pts)
  let profitScore = 0;
  if (params.roi > 0.25) { profitScore = 30; breakdown.push('Excellent ROI >25%'); }
  else if (params.roi > 0.15) { profitScore = 22; breakdown.push('Good ROI >15%'); }
  else if (params.roi > 0.08) { profitScore = 14; breakdown.push('OK ROI >8%'); }
  else if (params.roi > 0) { profitScore = 6; breakdown.push('Low ROI <8%'); }
  else { profitScore = 0; breakdown.push('Negative ROI'); badges.push('LOSS_RISK'); }
  if (params.profit > 5000) { profitScore = Math.min(30, profitScore + 5); }
  total += profitScore;

  // 3. Tax/VAT certainty (0–15 pts)
  let taxScore = 0;
  if (params.taxKnown && params.vatSchemeKnown) { taxScore = 15; breakdown.push('Tax & VAT confirmed'); }
  else if (params.taxKnown || params.vatSchemeKnown) { taxScore = 8; breakdown.push('Partial tax info'); }
  else { taxScore = 0; badges.push('TAX_MISSING'); badges.push('VAT_UNKNOWN'); breakdown.push('Tax & VAT unknown'); }
  total += taxScore;

  // 4. Sellability (0–10 pts)
  let sellScore = 5;
  if (params.mileageKm < 50000) { sellScore = 10; breakdown.push('Low mileage – easy to sell'); }
  else if (params.mileageKm < 100000) { sellScore = 7; }
  else if (params.mileageKm > 200000) { sellScore = 2; badges.push('HIGH_KM'); }
  if (params.hasDamage) { sellScore = Math.max(0, sellScore - 4); badges.push('DAMAGE_RISK'); }
  total += sellScore;

  // 5. Data quality (0–5 pts)
  let dataScore = 0;
  if (params.compCount >= 10) dataScore = 5;
  else if (params.compCount >= 5) dataScore = 3;
  else if (params.compCount >= 2) dataScore = 1;
  total += dataScore;

  // Capital binding badge
  if (params.capitalBinding === 'high') badges.push('HIGH_CAPITAL_BINDING');
  else if (params.capitalBinding === 'medium') badges.push('MEDIUM_CAPITAL_BINDING');

  const clamped = Math.max(0, Math.min(100, total));
  const recommendation: 'BUY' | 'CONSIDER' | 'DROP' =
    clamped >= 65 ? 'BUY' : clamped >= 40 ? 'CONSIDER' : 'DROP';

  return {
    total: clamped,
    priceVsMarket: priceScore,
    profitROI: profitScore,
    taxVATCertainty: taxScore,
    sellability: sellScore,
    dataQuality: dataScore,
    breakdown,
    riskBadges: badges,
    recommendation,
  };
}

// ─── DK Registration Tax Estimate ────────────────────────────────────────────
// Simplified DK reg tax model (not ASG, for demo purposes)
export function estimateDKRegistrationTax(params: {
  vehicleValueDKK: number;
  year: number;
  fuelType: string;
  mileageKm: number;
}): number {
  const { vehicleValueDKK, year, fuelType } = params;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  // Base: progressive DK reg tax
  let taxRate = 0;
  if (vehicleValueDKK <= 197700) taxRate = 0.85;
  else taxRate = 0.85 + (vehicleValueDKK - 197700) * (1.5 / vehicleValueDKK);

  let tax = vehicleValueDKK * Math.min(taxRate, 1.5);

  // EV reduction (simplified)
  if (fuelType === 'electric') tax = tax * 0.4;

  // Age deduction (approx)
  if (age > 3) tax = tax * Math.max(0.5, 1 - age * 0.05);

  return Math.round(tax);
}

// ─── Currency helpers ─────────────────────────────────────────────────────────
export const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1,
  DKK: 7.46,
  SEK: 11.2,
  NOK: 11.5,
  PLN: 4.3,
  GBP: 0.86,
};

export function convertCurrency(amountEur: number, toCurrency: string): number {
  const rate = EXCHANGE_RATES[toCurrency] ?? 1;
  return amountEur * rate;
}

export function toEUR(amount: number, fromCurrency: string): number {
  const rate = EXCHANGE_RATES[fromCurrency] ?? 1;
  return amount / rate;
}

export function fmt(amount: number, currency = 'EUR', locale = 'da-DK'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function fmtPct(ratio: number): string {
  return (ratio * 100).toFixed(1) + '%';
}
