import { Property, UserProfile } from '../types';

export function formatRand(n: number): string {
  const v = Math.round(Number(n) || 0);
  return "R" + v.toLocaleString("en-ZA").replace(/\u00a0/g, ",").replace(/\s/g, ",");
}

export function formatKm(v: number): string {
  return String(v).replace(".", ",") + " km";
}

export function calculateMatchScore(p: Property, profile: Partial<UserProfile>) {
  const pri = profile.priorities || [];
  const budget = Number(profile.budget) || 3500;
  const has = (k: string) => pri.indexOf(k) > -1;

  let score = 0;
  const reasons: { ok: boolean; text: string }[] = [];

  // Budget fit — 22 points, 30 if Affordability is a priority
  const budgetWeight = has("affordability") ? 30 : 22;
  if (p.price <= budget) {
    score += budgetWeight;
    reasons.push({ ok: true, text: "Within your budget" });
  } else if (p.price <= budget * 1.1) {
    score += Math.round(budgetWeight * 0.55);
    reasons.push({ ok: false, text: formatRand(p.price - budget) + " over your budget" });
  } else {
    reasons.push({ ok: false, text: formatRand(p.price - budget) + " over your budget" });
  }

  // Distance — 15 points, 22 if Close to campus is a priority
  const distWeight = has("campus") ? 22 : 15;
  const distFactor = p.distanceKm <= 1 ? 1 : p.distanceKm <= 2 ? 0.8 : p.distanceKm <= 5 ? 0.5 : 0.2;
  score += distWeight * distFactor;
  if (p.distanceKm <= 2) {
    reasons.push({ ok: true, text: "Close to Wits (" + formatKm(p.distanceKm) + ")" });
  } else {
    reasons.push({ ok: false, text: formatKm(p.distanceKm) + " from Wits" });
  }

  // Funding compatibility — 16 points, indicative
  const funded = profile.funding === "nsfas" || profile.funding === "university";
  const fundOk = funded ? p.nsfas : true;
  score += fundOk ? 16 : 0;
  reasons.push({
    ok: fundOk,
    text: funded
      ? fundOk
        ? "Compatible with " + (profile.funding === "nsfas" ? "NSFAS" : "university") + " funding"
        : "Not listed as funding compatible"
      : "No funding restriction"
  });

  // Verification — 14 points, 18 if Safety is a priority
  const verWeight = has("safety") ? 18 : 14;
  const verFactor = p.verified ? 1 : p.passedChecks > 0 ? 0.35 : 0;
  score += verWeight * verFactor;
  if (p.verified) {
    reasons.push({ ok: true, text: "StaySure verified listing" });
  }

  // Preferred-facility coverage — 18 points
  const wantedFacilities = pri.filter((k) =>
    ["wifi", "furnished", "meals", "transport"].indexOf(k) > -1
  );
  const wantedType = has("private") ? "Private room" : null;
  const facTotal = wantedFacilities.length + (wantedType ? 1 : 0);
  let facHit = 0;
  wantedFacilities.forEach((f) => {
    if (p.facilities.indexOf(f) > -1) facHit++;
  });
  if (wantedType && p.type === wantedType) facHit++;
  if (facTotal > 0) {
    score += 18 * (facHit / facTotal);
    if (facHit === facTotal) reasons.push({ ok: true, text: "Matches your preferred facilities" });
    else if (facHit > 0) reasons.push({ ok: false, text: "Covers some of your preferences" });
  } else {
    score += 12;
  }

  // Rating adjustment — up to ±4
  score += (p.rating - 4) * 4;

  const final = Math.max(28, Math.min(96, Math.round(score * 0.88)));
  const okCount = reasons.filter((r) => r.ok).length;

  return {
    score: final,
    reasons: reasons.slice(0, 4),
    okCount: okCount
  };
}

