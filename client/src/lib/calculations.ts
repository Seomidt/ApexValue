import type { Vehicle } from "@shared/schema";

export function calcTotalCost(v: Vehicle): number {
  return (v.purchasePrice || 0) +
    (v.auctionFees || 0) +
    (v.transportCost || 0) +
    (v.preparationCost || 0) +
    (v.inspectionCost || 0) +
    (v.otherCosts || 0) +
    (v.registrationTax || 0) -
    (v.vatReturn || 0);
}

export function calcProfit(v: Vehicle, scenario: "conservative" | "normal" | "optimistic"): number {
  const total = calcTotalCost(v);
  const resale = scenario === "conservative" ? v.resaleConservative :
    scenario === "optimistic" ? v.resaleOptimistic : v.resaleNormal;
  return (resale || 0) - total;
}

export function calcROI(v: Vehicle, scenario: "conservative" | "normal" | "optimistic"): number {
  const total = calcTotalCost(v);
  if (total === 0) return 0;
  return (calcProfit(v, scenario) / total) * 100;
}

export function calcMaxBid(v: Vehicle, desiredProfit: number = 15000): number {
  const costsExcludingPurchase =
    (v.auctionFees || 0) +
    (v.transportCost || 0) +
    (v.preparationCost || 0) +
    (v.inspectionCost || 0) +
    (v.otherCosts || 0) +
    (v.registrationTax || 0) -
    (v.vatReturn || 0);
  return (v.resaleNormal || 0) - costsExcludingPurchase - desiredProfit;
}

export function calcDealScore(v: Vehicle): number {
  let score = 0;
  const total = calcTotalCost(v);
  const profit = calcProfit(v, "normal");
  const roi = calcROI(v, "normal");

  if (v.resaleNormal && v.purchasePrice) {
    const priceRatio = v.purchasePrice / v.resaleNormal;
    if (priceRatio < 0.5) score += 40;
    else if (priceRatio < 0.6) score += 35;
    else if (priceRatio < 0.7) score += 28;
    else if (priceRatio < 0.8) score += 18;
    else if (priceRatio < 0.9) score += 8;
    else score += 2;
  }

  if (roi > 30) score += 30;
  else if (roi > 20) score += 25;
  else if (roi > 15) score += 20;
  else if (roi > 10) score += 14;
  else if (roi > 5) score += 8;
  else if (roi > 0) score += 3;

  if (v.vatType !== "unknown") score += 10;
  else score += 2;
  if (v.registrationTax !== null && v.registrationTax !== undefined) score += 5;

  if (v.year && v.year >= new Date().getFullYear() - 5) score += 7;
  else if (v.year && v.year >= new Date().getFullYear() - 8) score += 4;
  else score += 1;
  if (v.mileageKm < 100000) score += 3;
  else if (v.mileageKm < 150000) score += 1;

  return Math.min(100, Math.max(0, score));
}

export function getDealRecommendation(score: number): "buy" | "consider" | "drop" {
  if (score >= 70) return "buy";
  if (score >= 40) return "consider";
  return "drop";
}

export function getRiskFlags(v: Vehicle): string[] {
  const flags: string[] = [];
  if (v.vatType === "unknown") flags.push("Ukendt momstype");
  if (v.registrationTax === null || v.registrationTax === undefined) flags.push("Ukendt registreringsafgift");
  if (v.mileageKm > 200000) flags.push("Meget højt kilometertal");
  else if (v.mileageKm > 150000) flags.push("Højt kilometertal");
  if (v.year && v.year < new Date().getFullYear() - 10) flags.push("Ældre bil");
  const total = calcTotalCost(v);
  if (total > 300000) flags.push("Høj kapitalbinding");
  const profit = calcProfit(v, "normal");
  if (profit < 0) flags.push("Negativ fortjeneste");
  return flags;
}
