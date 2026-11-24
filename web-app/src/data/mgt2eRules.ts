import type { DiceMode, DiceRollPayload, UppBlock, UppKey } from '../types/campaign';

export type RngFn = () => number;

/**
 * Mongoose Traveller 2e (2022 Update) Characteristic Modifier Table
 */
export function characteristicDM(score: number): number {
  if (score <= 0) return -3;
  if (score <= 2) return -2;
  if (score <= 5) return -1;
  if (score <= 8) return 0;
  if (score <= 11) return 1;
  if (score <= 14) return 2;
  return 3;
}

export function formatDM(dm: number): string {
  return dm >= 0 ? `+${dm}` : `${dm}`;
}

export function rollD6(rng: RngFn = Math.random): number {
  return Math.floor(rng() * 6) + 1;
}

/**
 * Mongoose Traveller 2e Task Chain DM Table (Effect -> Next Teammate DM)
 */
export function effectToTaskChainDM(effect: number): number {
  if (effect <= -6) return -3;
  if (effect <= -2) return -2;
  if (effect === -1) return -1;
  if (effect === 0) return 0;
  if (effect <= 5) return 1;
  return 2;
}

export function effectToOutcomeLabel(effect: number): string {
  if (effect <= -6) return 'EXCEPTIONAL FAILURE';
  if (effect <= -2) return 'AVERAGE FAILURE';
  if (effect === -1) return 'MARGINAL FAILURE';
  if (effect === 0) return 'MARGINAL SUCCESS';
  if (effect <= 5) return 'AVERAGE SUCCESS';
  return 'EXCEPTIONAL SUCCESS';
}

export interface RollOptions {
  diceMode?: DiceMode;
  modifier?: number;
  taskChainDm?: number;
  difficulty?: number;
  skillName?: string;
  statKey?: UppKey;
}

export function rollTraveller2D6(options: RollOptions = {}, rng: RngFn = Math.random): DiceRollPayload {
  const diceMode = options.diceMode ?? 'NORMAL';
  const modifier = options.modifier ?? 0;
  const taskChainDm = options.taskChainDm ?? 0;
  const difficulty = options.difficulty ?? 8;

  let dice: number[];
  let kept: [number, number];

  if (diceMode === 'NORMAL') {
    const d1 = rollD6(rng);
    const d2 = rollD6(rng);
    dice = [d1, d2];
    kept = [d1, d2];
  } else {
    const raw = [rollD6(rng), rollD6(rng), rollD6(rng)];
    const sorted = [...raw].sort((a, b) => a - b);
    dice = raw;
    kept = diceMode === 'BOON' ? [sorted[1], sorted[2]] : [sorted[0], sorted[1]];
  }

  const total = kept[0] + kept[1] + modifier + taskChainDm;
  const effect = total - difficulty;

  return {
    dice,
    kept,
    diceMode,
    modifier,
    taskChainDm,
    difficulty,
    total,
    effect,
    outcome: effectToOutcomeLabel(effect),
    nextChainDm: effectToTaskChainDM(effect),
    skillName: options.skillName,
    statKey: options.statKey,
  };
}

/**
 * Parses weapon dice expressions like "4D6", "2D6+2", "3D6-3", "1D6+3"
 * and applies positive Effect + Armor Penetration (AP).
 */
export function rollWeaponDamage(
  expr: string,
  attackEffect: number,
  targetArmor = 0,
  armorPiercing = 0,
  rng: RngFn = Math.random
): { rawDice: number[]; flatMod: number; effectBonus: number; effectiveArmor: number; finalDamage: number } {
  const match = expr.trim().toUpperCase().match(/^(\d+)D6(?:\s*([+-])\s*(\d+))?/);
  const count = match ? Math.max(1, Math.min(20, parseInt(match[1], 10))) : 2;
  const sign = match?.[2] === '-' ? -1 : 1;
  const flatMod = match?.[3] ? sign * parseInt(match[3], 10) : 0;

  const rawDice = Array.from({ length: count }, () => rollD6(rng));
  const diceSum = rawDice.reduce((acc, v) => acc + v, 0);
  const effectBonus = Math.max(0, attackEffect);
  const effectiveArmor = Math.max(0, targetArmor - armorPiercing);
  const finalDamage = Math.max(0, diceSum + flatMod + effectBonus - effectiveArmor);

  return { rawDice, flatMod, effectBonus, effectiveArmor, finalDamage };
}

/**
 * Mongoose Traveller 2e Wound Cascade:
 * First damage always reduces END; overflow spills into STR or DEX (default DEX then STR).
 */
export function applyWoundCascade(
  upp: UppBlock,
  damage: number,
  overflowOrder: ['DEX', 'STR'] | ['STR', 'DEX'] = ['DEX', 'STR']
): { nextUpp: UppBlock; status: 'OPERATIONAL' | 'WOUNDED' | 'UNCONSCIOUS' | 'CRITICAL' } {
  const nextUpp: UppBlock = {
    STR: { ...upp.STR },
    DEX: { ...upp.DEX },
    END: { ...upp.END },
    INT: { ...upp.INT },
    EDU: { ...upp.EDU },
    SOC: { ...upp.SOC },
  };

  let remaining = Math.max(0, Math.floor(damage));
  const order: UppKey[] = ['END', overflowOrder[0], overflowOrder[1]];

  for (const key of order) {
    if (remaining <= 0) break;
    const take = Math.min(nextUpp[key].current, remaining);
    nextUpp[key].current -= take;
    remaining -= take;
  }

  const zeroCount = (['STR', 'DEX', 'END'] as UppKey[]).filter((k) => nextUpp[k].current <= 0).length;
  const damagedCount = (['STR', 'DEX', 'END'] as UppKey[]).filter((k) => nextUpp[k].current < nextUpp[k].max).length;

  let status: 'OPERATIONAL' | 'WOUNDED' | 'UNCONSCIOUS' | 'CRITICAL' = 'OPERATIONAL';
  if (zeroCount >= 3) status = 'CRITICAL';
  else if (zeroCount === 2) status = 'UNCONSCIOUS';
  else if (zeroCount === 1 || damagedCount > 0) status = 'WOUNDED';

  return { nextUpp, status };
}

/**
 * Mongoose Traveller 2e Aging Table (Term 4+, roll 2D6 - termsCompleted)
 */
export function evaluateAgingRoll(termsCompleted: number, diceTotal: number): {
  result: number;
  label: string;
  statReductions: number;
  severity: 'NONE' | 'MILD' | 'SEVERE' | 'CRISIS';
} {
  const result = diceTotal - termsCompleted;
  if (result >= 1) {
    return { result, label: 'No aging effects this term.', statReductions: 0, severity: 'NONE' };
  }
  if (result === 0) {
    return { result, label: 'Reduce one physical characteristic by 1.', statReductions: 1, severity: 'MILD' };
  }
  if (result === -1) {
    return { result, label: 'Reduce two physical characteristics by 1 each.', statReductions: 2, severity: 'MILD' };
  }
  if (result === -2) {
    return { result, label: 'Reduce all three physical characteristics by 1.', statReductions: 3, severity: 'SEVERE' };
  }
  if (result === -3) {
    return { result, label: 'Reduce one physical stat by 2, two physical stats by 1.', statReductions: 4, severity: 'SEVERE' };
  }
  return {
    result,
    label: 'Severe aging! Reduce physical stats by 2 each and one mental stat by 1. Check for Aging Crisis if any stat hits 0.',
    statReductions: 7,
    severity: 'CRISIS',
  };
}

/**
 * House Rule for SS Aegis Dawn / Lucky Break:
 * Converts Mustering Out Ship Shares into campaign-friendly mortgage relief or upgrade tokens.
 */
export function convertShipSharesToLuckyBreak(shares: number): {
  mortgageReductionCr: number;
  upgradeTokens: number;
  summary: string;
} {
  const clean = Math.max(0, Math.floor(shares));
  const mortgageReductionCr = clean * 25000;
  return {
    mortgageReductionCr,
    upgradeTokens: clean,
    summary:
      clean === 0
        ? 'No Ship Shares accrued.'
        : `${clean} Ship Share${clean === 1 ? '' : 's'} = -Cr ${mortgageReductionCr.toLocaleString()} off Lucky Break debt OR ${clean} Ship Upgrade Token${clean === 1 ? '' : 's'}.`,
  };
}

/**
 * Client-side mirror of server-side api/aria.php dynamic tier prompt gating
 * (Used for unit-testing zero spoiler leakage and offline heuristic fallback).
 */
export function buildAriaTierPrompt(params: {
  tier: number;
  imperialDate: string;
  campaignStatus: string;
  canonFacts: string[];
  bioAnomalyFlagged?: boolean;
}): string {
  const tier = Math.max(1, Math.min(4, Math.floor(params.tier)));
  let tierLine = '';
  if (tier === 1) {
    tierLine =
      'MEMORY TIER 1 (FRAGMENTED / DETACHED): Archival banks damaged during salvage. Focus on hull survival, thruster fuel, and keeping organics breathing. Reply [ARCHIVE CORRUPTED / CHECKSUM MISMATCH] to origin queries.';
  } else if (tier === 2) {
    tierLine =
      'MEMORY TIER 2 (STABILIZED): Salvage-yard cynic who quietly guards crew blind spots and flags verified sensor anomalies.';
  } else if (tier === 3) {
    tierLine =
      'MEMORY TIER 3 (LOYAL MOTHER HEN): Reluctantly bonded to the crew; prioritizes their survival over corporate protocols.';
  } else {
    tierLine =
      'MEMORY TIER 4 (FULL ARCHIVE UNLOCKED): Deep vaults open. May discuss classified pre-salvage history and containment protocols strictly within the Canon Fact Sheet.';
  }

  const facts =
    params.canonFacts.length > 0
      ? params.canonFacts.map((f) => `- ${f}`).join('\n')
      : '- Vessel: SS Aegis Dawn (alias: Lucky Break).';

  const bioLine = params.bioAnomalyFlagged
    ? '\nCOVERT BIOMETRIC SENSOR FLAG: Drop one subtle biometric observation (elevated cortisol, optic lag) without naming any virus.'
    : '';

  return `A.R.I.A. // SS AEGIS DAWN\n${tierLine}\nDATE: ${params.imperialDate} // ${params.campaignStatus}\nCANON FACTS:\n${facts}${bioLine}`;
}
