import { describe, expect, it } from 'vitest';
import {
  MGT2E_CAREERS,
  PRE_CAREER_OPTIONS,
  getBasicTrainingPool,
  getCareerById,
} from '../data/mgt2eCareers';
import {
  applyWoundCascade,
  buildAriaTierPrompt,
  characteristicDM,
  convertShipSharesToLuckyBreak,
  effectToTaskChainDM,
  evaluateAgingRoll,
  rollTraveller2D6,
  rollWeaponDamage,
} from '../data/mgt2eRules';
import type { UppBlock } from '../types/campaign';

function sequenceRng(rolls: number[]): () => number {
  let idx = 0;
  return () => {
    const face = rolls[idx % rolls.length];
    idx++;
    return (face - 0.5) / 6;
  };
}

describe('Mongoose Traveller 2e Rules Engine', () => {
  it('computes exact MgT2e Characteristic DMs', () => {
    expect(characteristicDM(0)).toBe(-3);
    expect(characteristicDM(1)).toBe(-2);
    expect(characteristicDM(2)).toBe(-2);
    expect(characteristicDM(3)).toBe(-1);
    expect(characteristicDM(5)).toBe(-1);
    expect(characteristicDM(6)).toBe(0);
    expect(characteristicDM(8)).toBe(0);
    expect(characteristicDM(9)).toBe(1);
    expect(characteristicDM(11)).toBe(1);
    expect(characteristicDM(12)).toBe(2);
    expect(characteristicDM(14)).toBe(2);
    expect(characteristicDM(15)).toBe(3);
  });

  it('supports NORMAL, BOON (keep highest 2), and BANE (keep lowest 2) rolls + Task Chain DM', () => {
    const boon = rollTraveller2D6(
      { diceMode: 'BOON', modifier: 2, difficulty: 8, taskChainDm: 1 },
      sequenceRng([2, 6, 5])
    );
    expect(boon.dice).toEqual([2, 6, 5]);
    expect(boon.kept).toEqual([5, 6]);
    expect(boon.total).toBe(14);
    expect(boon.effect).toBe(6);
    expect(boon.nextChainDm).toBe(2);
    expect(boon.outcome).toBe('EXCEPTIONAL SUCCESS');

    const bane = rollTraveller2D6(
      { diceMode: 'BANE', modifier: 0, difficulty: 8 },
      sequenceRng([6, 1, 2])
    );
    expect(bane.kept).toEqual([1, 2]);
    expect(bane.total).toBe(3);
    expect(bane.effect).toBe(-5);
    expect(bane.nextChainDm).toBe(-2);

    expect(effectToTaskChainDM(-6)).toBe(-3);
    expect(effectToTaskChainDM(-1)).toBe(-1);
    expect(effectToTaskChainDM(0)).toBe(0);
    expect(effectToTaskChainDM(3)).toBe(1);
    expect(effectToTaskChainDM(6)).toBe(2);
  });

  it('applies MgT2e wound cascade (END -> DEX -> STR) and unconsciousness thresholds', () => {
    const baseUpp: UppBlock = {
      STR: { max: 8, current: 8 },
      DEX: { max: 7, current: 7 },
      END: { max: 9, current: 9 },
      INT: { max: 7, current: 7 },
      EDU: { max: 7, current: 7 },
      SOC: { max: 6, current: 6 },
    };

    const hit1 = applyWoundCascade(baseUpp, 11);
    expect(hit1.nextUpp.END.current).toBe(0);
    expect(hit1.nextUpp.DEX.current).toBe(5);
    expect(hit1.nextUpp.STR.current).toBe(8);
    expect(hit1.status).toBe('WOUNDED');

    const hit2 = applyWoundCascade(hit1.nextUpp, 6);
    expect(hit2.nextUpp.DEX.current).toBe(0);
    expect(hit2.nextUpp.STR.current).toBe(7);
    expect(hit2.status).toBe('UNCONSCIOUS');

    const hit3 = applyWoundCascade(hit2.nextUpp, 10);
    expect(hit3.nextUpp.STR.current).toBe(0);
    expect(hit3.status).toBe('CRITICAL');
  });

  it('calculates weapon damage with positive Effect and AP armor reduction', () => {
    const res = rollWeaponDamage('3D6-3', 4, 8, 4, sequenceRng([5, 4, 3]));
    // diceSum = 12, flatMod = -3, effectBonus = 4, effectiveArmor = 8 - 4 = 4 => 12 - 3 + 4 - 4 = 9
    expect(res.finalDamage).toBe(9);
    expect(res.effectiveArmor).toBe(4);
  });

  it('evaluates Term 4+ aging rolls and Lucky Break Ship-Share house rule', () => {
    expect(evaluateAgingRoll(4, 9).severity).toBe('NONE');
    expect(evaluateAgingRoll(4, 4).statReductions).toBe(1);
    expect(evaluateAgingRoll(6, 2).severity).toBe('CRISIS');

    const shares = convertShipSharesToLuckyBreak(3);
    expect(shares.mortgageReductionCr).toBe(75000);
    expect(shares.upgradeTokens).toBe(3);
  });

  it('includes all 12 Core MgT2e Careers (36 Assignments), Pre-Career options, and Citizen/Drifter Basic Training overrides', () => {
    expect(MGT2E_CAREERS).toHaveLength(12);
    const totalAssignments = MGT2E_CAREERS.reduce((sum, c) => sum + c.assignments.length, 0);
    expect(totalAssignments).toBe(36);
    expect(PRE_CAREER_OPTIONS.length).toBeGreaterThanOrEqual(4);

    const citizen = getCareerById('citizen')!;
    const corpBasic = getBasicTrainingPool(citizen, 'corporate');
    expect(corpBasic).toContain('Broker'); // Specialist table override, not generic serviceSkills

    const navy = getCareerById('navy')!;
    expect(navy.isMilitary).toBe(true);
    expect(navy.commission?.target).toBe(8);
  });

  it('strictly prevents Tier 4 spoiler leaks in A.R.I.A. prompts for Tiers 1-3', () => {
    for (const tier of [1, 2, 3]) {
      const prompt = buildAriaTierPrompt({
        tier,
        imperialDate: '1105-042',
        campaignStatus: 'Docked at Bay 67',
        canonFacts: ['Vessel: SS Aegis Dawn / Lucky Break.'],
      });
      expect(prompt.toLowerCase()).not.toContain('bio-weapon');
      expect(prompt.toLowerCase()).not.toContain('pre-salvage history');
    }

    const infectedPrompt = buildAriaTierPrompt({
      tier: 1,
      imperialDate: '1105-042',
      campaignStatus: 'In Jump',
      canonFacts: [],
      bioAnomalyFlagged: true,
    });
    expect(infectedPrompt).toContain('COVERT BIOMETRIC SENSOR FLAG');
  });
});
