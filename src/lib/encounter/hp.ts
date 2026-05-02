export type HpStatus = "Healthy" | "Bloodied" | "Critical" | "Down";

export function applyDamage(currentHp: number, amount: number): number {
  return Math.max(0, currentHp - Math.max(0, amount));
}

export function applyHealing(
  currentHp: number,
  maxHp: number,
  amount: number,
): number {
  return Math.min(maxHp, currentHp + Math.max(0, amount));
}

export function getHpStatus(currentHp: number, maxHp: number): HpStatus {
  if (currentHp <= 0) {
    return "Down";
  }

  const ratio = currentHp / Math.max(maxHp, 1);

  if (ratio <= 0.25) {
    return "Critical";
  }

  if (ratio <= 0.5) {
    return "Bloodied";
  }

  return "Healthy";
}

export function getHpPercent(currentHp: number, maxHp: number): number {
  if (maxHp <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
}
