import React, { useMemo, useState } from 'react';
import {
  Award,
  Bot,
  Briefcase,
  CheckCircle2,
  Dices,
  GraduationCap,
  HeartPulse,
  Link2,
  Package,
  Plus,
  Sparkles,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  BACKGROUND_SKILLS,
  DRAFT_CAREERS,
  INJURY_TABLE,
  LIFE_EVENTS_TABLE,
  MGT2E_CAREERS,
  PRE_CAREER_OPTIONS,
  SKILL_PACKAGES,
  getBasicTrainingPool,
  getCareerById,
} from '../data/mgt2eCareers';
import {
  characteristicDM,
  convertShipSharesToLuckyBreak,
  evaluateAgingRoll,
  formatDM,
  rollD6,
  rollTraveller2D6,
} from '../data/mgt2eRules';
import { PRESET_CREW_TEMPLATES } from '../data/campaignPresets';
import { makeId } from '../services/campaignStore';
import type {
  CampaignSnapshot,
  CareerTermRecord,
  TravellerCharacter,
  UppKey,
} from '../types/campaign';

const UPP_KEYS: UppKey[] = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];

const TOKEN_CHOICES = [
  { label: 'Declan', url: '/aegis/assets/tokens/token_declan_vance.png' },
  { label: 'Kallie', url: '/aegis/assets/tokens/token_kallie_reyes.png' },
  { label: 'Borg', url: '/aegis/assets/tokens/token_borg_turok.png' },
  { label: 'Jax', url: '/aegis/assets/tokens/token_jax_mercer.png' },
  { label: 'Pippa', url: '/aegis/assets/tokens/token_pippa_chen.png' },
  { label: 'Scout', url: '/aegis/assets/tokens/token_starship_scout.png' },
];

type WizardStep = 'STATS' | 'BACKGROUND' | 'CAREERS' | 'CONNECTIONS' | 'MUSTER';

interface Session0CopilotProps {
  character: TravellerCharacter;
  snapshot: CampaignSnapshot;
  onUpdateCharacter: (next: TravellerCharacter) => Promise<void>;
  onBroadcastLifepath: (title: string, body: string, roll?: import('../types/campaign').DiceRollPayload) => Promise<void>;
  onAriaReact: (summary: string) => Promise<void>;
  onClaimPackageSkill: (packageId: string, skill: string) => Promise<void>;
  onFinishToSheet: () => void;
  ariaBusy: boolean;
}

export const Session0Copilot: React.FC<Session0CopilotProps> = ({
  character,
  snapshot,
  onUpdateCharacter,
  onBroadcastLifepath,
  onAriaReact,
  onClaimPackageSkill,
  onFinishToSheet,
  ariaBusy,
}) => {
  const [step, setStep] = useState<WizardStep>('STATS');
  const [selectedCareerId, setSelectedCareerId] = useState<string>('scout');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('courier');
  const [termLogNote, setTermLogNote] = useState<string>('');
  const [lastEventText, setLastEventText] = useState<string>('');
  const [lastMishapText, setLastMishapText] = useState<string>('');
  const [lastRollBanner, setLastRollBanner] = useState<string>('');
  const [qualFailed, setQualFailed] = useState(false);
  const [currentRank, setCurrentRank] = useState(0);
  const [isOfficer, setIsOfficer] = useState(false);

  // Connections form state
  const [connPartnerId, setConnPartnerId] = useState<string>('');
  const [connSummary, setConnSummary] = useState<string>('');
  const [connSkill, setConnSkill] = useState<string>('Pilot (Spacecraft)');

  const activeCareer = useMemo(
    () => getCareerById(selectedCareerId) ?? MGT2E_CAREERS[0],
    [selectedCareerId]
  );

  const activeAssignment = useMemo(
    () =>
      activeCareer.assignments.find((a) => a.id === selectedAssignmentId) ??
      activeCareer.assignments[0],
    [activeCareer, selectedAssignmentId]
  );

  const priorDistinctCareers = useMemo(() => {
    const ids = new Set(character.terms.map((t) => t.careerId));
    ids.delete(activeCareer.id);
    return ids.size;
  }, [character.terms, activeCareer.id]);

  const termsInActiveCareer = useMemo(
    () => character.terms.filter((t) => t.careerId === activeCareer.id).length,
    [character.terms, activeCareer.id]
  );

  const otherCrewChars = useMemo(
    () => Object.values(snapshot.characters).filter((c) => c.id !== character.id),
    [snapshot.characters, character.id]
  );

  const bgAllowed = Math.max(1, characteristicDM(character.upp.EDU.max) + 3);
  const shipShareConversion = convertShipSharesToLuckyBreak(character.shipShares);

  const setUppValue = async (key: UppKey, value: number) => {
    const clamped = Math.max(1, Math.min(15, value));
    await onUpdateCharacter({
      ...character,
      upp: {
        ...character.upp,
        [key]: { max: clamped, current: clamped },
      },
    });
  };

  const rollAllStats = async () => {
    const nextUpp = { ...character.upp };
    const summaryParts: string[] = [];
    for (const key of UPP_KEYS) {
      const val = rollD6() + rollD6();
      nextUpp[key] = { max: val, current: val };
      summaryParts.push(`${key} ${val} (${formatDM(characteristicDM(val))})`);
    }
    await onUpdateCharacter({ ...character, upp: nextUpp });
    await onBroadcastLifepath('SESSION 0 // UPP ROLLED', `${character.name} rolled characteristics: ${summaryParts.join(' • ')}`);
  };

  const applyPresetTemplate = async (presetName: string) => {
    const preset = PRESET_CREW_TEMPLATES.find((p) => p.name === presetName);
    if (!preset) return;
    await onUpdateCharacter({
      ...character,
      ...preset,
      id: character.id,
      ownerUid: character.ownerUid,
      ownerName: character.ownerName,
      updatedAt: Date.now(),
    });
    await onBroadcastLifepath(
      'PRESET CREW LOADED',
      `${character.ownerName} imported preset dossier: ${preset.name} (${preset.archetype}).`
    );
  };

  const grantSkill = async (skillRaw: string, targetLevel?: number) => {
    // Handle stat boosts like "+1 INT" cleanly!
    const statMatch = skillRaw.match(/^\+(\d)\s+(STR|DEX|END|INT|EDU|SOC)/i);
    if (statMatch) {
      const delta = parseInt(statMatch[1], 10);
      const statKey = statMatch[2].toUpperCase() as UppKey;
      await setUppValue(statKey, character.upp[statKey].max + delta);
      setLastRollBanner(`Applied ${skillRaw} to ${character.name}.`);
      return;
    }

    const current = character.skills[skillRaw];
    const nextVal =
      targetLevel !== undefined
        ? Math.max(current ?? -1, targetLevel)
        : current === undefined
        ? 1
        : Math.min(4, current + 1);

    await onUpdateCharacter({
      ...character,
      skills: { ...character.skills, [skillRaw]: nextVal },
    });
    setLastRollBanner(`Skill updated: ${skillRaw} ${nextVal}`);
  };

  const applyBasicTraining = async (singleSkill?: string) => {
    const pool = getBasicTrainingPool(activeCareer, activeAssignment.id);
    const nextSkills = { ...character.skills };
    if (character.terms.length === 0 && !singleSkill) {
      for (const s of pool) {
        if (nextSkills[s] === undefined) nextSkills[s] = 0;
      }
      await onUpdateCharacter({ ...character, skills: nextSkills });
      setLastRollBanner(`Term 1 Basic Training granted all 6 skills at Level 0: ${pool.join(', ')}`);
    } else if (singleSkill) {
      if (nextSkills[singleSkill] === undefined) nextSkills[singleSkill] = 0;
      await onUpdateCharacter({ ...character, skills: nextSkills });
      setLastRollBanner(`Subsequent Career Basic Training: ${singleSkill} 0`);
    }
  };

  const rollPreCareer = async (preId: string) => {
    const pre = PRE_CAREER_OPTIONS.find((p) => p.id === preId);
    if (!pre) return;
    const entryDm = characteristicDM(character.upp[pre.entry.stat].max);
    const entryRoll = rollTraveller2D6({
      modifier: entryDm,
      difficulty: pre.entry.target,
      statKey: pre.entry.stat,
      skillName: `${pre.name} Entry`,
    });

    if (entryRoll.effect < 0) {
      setLastRollBanner(`Denied admission to ${pre.name} (Total ${entryRoll.total} vs ${pre.entry.target}+).`);
      await onBroadcastLifepath('PRE-CAREER ADMISSION FAILED', `${character.name} missed admission to ${pre.name}.`, entryRoll);
      return;
    }

    const gradDm = characteristicDM(character.upp[pre.graduation.stat].max);
    const gradRoll = rollTraveller2D6({
      modifier: gradDm,
      difficulty: pre.graduation.target,
      statKey: pre.graduation.stat,
      skillName: `${pre.name} Graduation`,
    });

    const graduated = gradRoll.effect >= 0;
    const honors = gradRoll.total >= pre.honorsTarget;
    const eduBoost = graduated ? (honors ? 2 : 1) : 0;

    const nextUpp = {
      ...character.upp,
      EDU: {
        max: Math.min(15, character.upp.EDU.max + eduBoost),
        current: Math.min(15, character.upp.EDU.current + eduBoost),
      },
    };
    const nextSkills = { ...character.skills };
    if (graduated) {
      const s0 = pre.skillsOffered[0];
      const s1 = pre.skillsOffered[1];
      nextSkills[s0] = Math.max(nextSkills[s0] ?? -1, 1);
      if (nextSkills[s1] === undefined) nextSkills[s1] = 0;
    }

    const termRec: CareerTermRecord = {
      id: makeId('term'),
      termNumber: character.terms.length + 1,
      ageStart: character.age,
      careerId: pre.id,
      careerName: pre.name,
      assignment: honors ? 'Graduated w/ Honors' : graduated ? 'Graduated' : 'Dropped Out',
      rank: 0,
      rankTitle: honors ? 'Honors Grad' : graduated ? 'Graduate' : 'Former Student',
      survived: graduated,
      advanced: honors,
      skillsGained: graduated ? [pre.skillsOffered[0], pre.skillsOffered[1]] : [],
    };

    await onUpdateCharacter({
      ...character,
      age: character.age + 4,
      upp: nextUpp,
      skills: nextSkills,
      terms: [...character.terms, termRec],
    });

    const summary = honors
      ? `GRADUATED WITH HONORS from ${pre.name}! (+${eduBoost} EDU, ${pre.honorsBonus})`
      : graduated
      ? `Graduated from ${pre.name}! (+${eduBoost} EDU, gained ${pre.skillsOffered[0]} 1 & ${pre.skillsOffered[1]} 0).`
      : `Attended ${pre.name} for 4 years but washed out before graduation.`;

    setLastRollBanner(summary);
    await onBroadcastLifepath(`PRE-CAREER // ${pre.name.toUpperCase()}`, `${character.name}: ${summary}`, gradRoll);
  };

  const rollQualification = async () => {
    setQualFailed(false);
    if (!activeCareer.qualification) {
      setLastRollBanner(`${activeCareer.name} auto-qualifies — no roll required!`);
      return;
    }
    const stat = activeCareer.qualification.stat;
    const mod = characteristicDM(character.upp[stat].max) - priorDistinctCareers;
    const roll = rollTraveller2D6({
      modifier: mod,
      difficulty: activeCareer.qualification.target,
      statKey: stat,
      skillName: `${activeCareer.name} Qualification`,
    });
    const passed = roll.effect >= 0;
    setQualFailed(!passed);
    setLastRollBanner(
      passed
        ? `QUALIFIED for ${activeCareer.name} (${activeAssignment.name})! Total ${roll.total} vs ${activeCareer.qualification.target}+ (prior career DM: -${priorDistinctCareers}).`
        : `FAILED Qualification for ${activeCareer.name} (Total ${roll.total} vs ${activeCareer.qualification.target}+). Enter The Draft (once per life) or take Drifter!`
    );
    await onBroadcastLifepath(
      `QUALIFICATION // ${activeCareer.name.toUpperCase()}`,
      `${character.name} ${passed ? 'qualified for' : 'was rejected by'} ${activeCareer.name} (${activeAssignment.name}).`,
      roll
    );
  };

  const enterTheDraft = async () => {
    const idx = rollD6() - 1;
    const draftedId = DRAFT_CAREERS[idx] ?? 'army';
    const draftedCareer = getCareerById(draftedId) ?? MGT2E_CAREERS[0];
    setSelectedCareerId(draftedCareer.id);
    setSelectedAssignmentId(draftedCareer.assignments[0].id);
    setQualFailed(false);
    await onUpdateCharacter({ ...character, draftUsed: true });
    const msg = `Drafted into ${draftedCareer.name} (${draftedCareer.assignments[0].name})! Remember: no Commission roll allowed during your drafted term.`;
    setLastRollBanner(msg);
    await onBroadcastLifepath('THE DRAFT', `${character.name} rolled ${idx + 1} -> ${msg}`);
  };

  const rollSurvival = async () => {
    const stat = activeAssignment.survival.stat;
    const mod = characteristicDM(character.upp[stat].max);
    const roll = rollTraveller2D6({
      modifier: mod,
      difficulty: activeAssignment.survival.target,
      statKey: stat,
      skillName: `${activeCareer.name} Survival`,
    });
    const natTwo = roll.kept[0] + roll.kept[1] === 2;
    const survived = !natTwo && roll.effect >= 0;

    if (!survived) {
      const mishapIdx = rollD6() - 1;
      const mishapText = activeCareer.mishaps[mishapIdx] ?? 'Unexpected career termination.';
      setLastMishapText(mishapText);
      setLastRollBanner(
        `${natTwo ? 'NATURAL 2 AUTO-MISHAP!' : 'SURVIVAL FAILED!'} Ejected from ${activeCareer.name} (no Advancement or Benefit roll this term). Mishap: ${mishapText}`
      );
      await onBroadcastLifepath(
        `MISHAP // ${activeCareer.name.toUpperCase()}`,
        `${character.name} suffered a career mishap: ${mishapText}`,
        roll
      );
    } else {
      setLastMishapText('');
      setLastRollBanner(`SURVIVED ${activeCareer.name} (${activeAssignment.name})! Total ${roll.total} vs ${activeAssignment.survival.target}+.`);
      await onBroadcastLifepath(
        `SURVIVAL // ${activeCareer.name.toUpperCase()}`,
        `${character.name} survived Term ${character.terms.length + 1} in ${activeCareer.name}.`,
        roll
      );
    }
  };

  const rollInjuryAndMedical = async () => {
    const idx = rollD6() - 1;
    const injury = INJURY_TABLE[idx];
    const bill = idx <= 4 ? 5000 * (idx <= 1 ? 3 : 2) : 0;
    const playerOwes = Math.round(bill * (1 - activeCareer.medicalCoverage / 100));
    if (playerOwes > 0) {
      await onUpdateCharacter({ ...character, medicalDebt: character.medicalDebt + playerOwes });
    }
    const text = `INJURY (${injury.roll}): ${injury.title} — ${injury.effect} (${activeCareer.medicalCoverage}% covered by ${activeCareer.name}; added Cr ${playerOwes.toLocaleString()} Medical Debt).`;
    setLastRollBanner(text);
    await onBroadcastLifepath('INJURY TABLE', `${character.name}: ${text}`);
  };

  const rollCareerEvent = async () => {
    const dTotal = rollD6() + rollD6();
    const raw = activeCareer.events[dTotal - 2] ?? 'Quiet frontier rotation.';
    const text = raw.replace(/^\d+:\s*/, '');
    setLastEventText(text);
    setLastRollBanner(`Career Event (${dTotal}): ${text}`);
    await onBroadcastLifepath(`EVENT // ${activeCareer.name.toUpperCase()}`, `${character.name} rolled ${dTotal}: ${text}`);
  };

  const rollLifeEvent = async () => {
    const dTotal = rollD6() + rollD6();
    const raw = LIFE_EVENTS_TABLE[dTotal - 2] ?? 'Unusual personal milestone.';
    const text = raw.replace(/^\d+:\s*/, '');
    setLastEventText(text);
    setLastRollBanner(`Life Event (${dTotal}): ${text}`);
    await onBroadcastLifepath('LIFE EVENT', `${character.name} rolled ${dTotal}: ${text}`);
  };

  const rollCommission = async () => {
    if (!activeCareer.commission) return;
    const mod = characteristicDM(character.upp[activeCareer.commission.stat].max);
    const roll = rollTraveller2D6({
      modifier: mod,
      difficulty: activeCareer.commission.target,
      statKey: activeCareer.commission.stat,
      skillName: `${activeCareer.name} Commission`,
    });
    const passed = roll.effect >= 0;
    if (passed) {
      setIsOfficer(true);
      setCurrentRank(1);
    }
    const msg = passed
      ? `COMMISSIONED! Officer Rank 1 (${activeCareer.officerRanks?.[0]?.title ?? 'Lieutenant'}) — unlocked Officer Skill Table.`
      : `Commission denied (Total ${roll.total} vs ${activeCareer.commission.target}+).`;
    setLastRollBanner(msg);
    await onBroadcastLifepath('MILITARY COMMISSION', `${character.name}: ${msg}`, roll);
  };

  const rollAdvancement = async () => {
    const stat = activeAssignment.advancement.stat;
    const mod = characteristicDM(character.upp[stat].max);
    const roll = rollTraveller2D6({
      modifier: mod,
      difficulty: activeAssignment.advancement.target,
      statKey: stat,
      skillName: `${activeCareer.name} Advancement`,
    });
    const rawDice = roll.kept[0] + roll.kept[1];
    const promoted = roll.effect >= 0;
    const nextRank = promoted ? Math.min(6, currentRank + 1) : currentRank;
    if (promoted) setCurrentRank(nextRank);

    const mandatoryStay = rawDice === 12;
    const forcedExit = !mandatoryStay && roll.total <= termsInActiveCareer + 1;

    const rankTable = isOfficer && activeCareer.officerRanks ? activeCareer.officerRanks : activeAssignment.ranks;
    const rankObj = rankTable.find((r) => r.rank === nextRank);
    const bonusNote = promoted && rankObj?.bonusSkill ? ` Rank bonus skill: ${rankObj.bonusSkill}!` : '';
    const stayNote = mandatoryStay
      ? ' [NAT 12: MANDATORY CONTINUATION NEXT TERM!]'
      : forcedExit
      ? ' [Roll <= Terms Served: FORCED CAREER EXIT after this term]'
      : '';

    const msg = `${promoted ? `PROMOTED to Rank ${nextRank} (${rankObj?.title ?? ''})!` : 'No promotion this term.'}${bonusNote}${stayNote}`;
    setLastRollBanner(msg);
    await onBroadcastLifepath(`ADVANCEMENT // ${activeCareer.name.toUpperCase()}`, `${character.name}: ${msg}`, roll);
  };

  const rollAging = async () => {
    const termsDone = character.terms.length + 1;
    const dTotal = rollD6() + rollD6();
    const res = evaluateAgingRoll(termsDone, dTotal);
    const msg = `Aging Roll (${dTotal} - ${termsDone} terms = ${res.result}): ${res.label}`;
    setLastRollBanner(msg);
    await onBroadcastLifepath('AGING CHECK', `${character.name}: ${msg}`);
  };

  const commitTerm = async () => {
    const rankTable = isOfficer && activeCareer.officerRanks ? activeCareer.officerRanks : activeAssignment.ranks;
    const rankObj = rankTable.find((r) => r.rank === currentRank);
    const record: CareerTermRecord = {
      id: makeId('term'),
      termNumber: character.terms.length + 1,
      ageStart: character.age,
      careerId: activeCareer.id,
      careerName: activeCareer.name,
      assignment: activeAssignment.name,
      rank: currentRank,
      rankTitle: rankObj?.title ?? `Rank ${currentRank}`,
      isOfficer,
      survived: !lastMishapText,
      advanced: currentRank > 0,
      mishap: lastMishapText || undefined,
      event: lastEventText || undefined,
      skillsGained: [],
      notes: termLogNote.trim() || undefined,
    };

    await onUpdateCharacter({
      ...character,
      age: character.age + 4,
      archetype: `${activeCareer.name} • ${activeAssignment.name}`,
      terms: [...character.terms, record],
    });
    setLastEventText('');
    setLastMishapText('');
    setTermLogNote('');
    setLastRollBanner(`Committed Term ${record.termNumber} (${activeCareer.name} — Age now ${character.age + 4}).`);
  };

  const addConnection = async () => {
    const partner = otherCrewChars.find((c) => c.id === connPartnerId) ?? otherCrewChars[0];
    if (!partner || !connSummary.trim()) return;
    const link = {
      id: makeId('conn'),
      partnerCharId: partner.id,
      partnerName: partner.name,
      termNumber: Math.max(1, character.terms.length),
      summary: connSummary.trim(),
      skillChosen: connSkill,
    };
    const currentSkillVal = character.skills[connSkill];
    const nextSkillVal = currentSkillVal === undefined ? 1 : Math.min(3, currentSkillVal + 1);

    await onUpdateCharacter({
      ...character,
      connections: [...character.connections, link],
      skills: { ...character.skills, [connSkill]: nextSkillVal },
    });
    await onBroadcastLifepath(
      'CONNECTION FORGED',
      `${character.name} ↔ ${partner.name}: "${link.summary}" (Gained ${connSkill} ${nextSkillVal})`
    );
    setConnSummary('');
  };

  const rollMusteringCash = async () => {
    const gamblingBonus = (character.skills.Gambler ?? -1) >= 1 ? 1 : 0;
    const rollIdx = Math.min(6, rollD6() - 1 + gamblingBonus);
    const amount = activeCareer.cashTable[rollIdx] ?? 5000;
    await onUpdateCharacter({
      ...character,
      credits: character.credits + amount,
      cashRollsUsed: character.cashRollsUsed + 1,
    });
    const msg = `Mustering Out Cash (${activeCareer.name}${gamblingBonus ? ', +1 Gambler DM' : ''}): +Cr ${amount.toLocaleString()} (Cash rolls used: ${character.cashRollsUsed + 1}/3).`;
    setLastRollBanner(msg);
    await onBroadcastLifepath('MUSTERING OUT // CASH', `${character.name}: ${msg}`);
  };

  const rollMusteringBenefit = async () => {
    const rankBonus = currentRank >= 5 ? 1 : 0;
    const rollIdx = Math.min(6, rollD6() - 1 + rankBonus);
    const item = activeCareer.benefitsTable[rollIdx] ?? '1 Ship Share';

    let nextShares = character.shipShares;
    const shareMatch = item.match(/(\d+)\s+Ship Share/i);
    if (shareMatch) {
      nextShares += parseInt(shareMatch[1], 10);
    }

    await onUpdateCharacter({
      ...character,
      shipShares: nextShares,
      gear: [...character.gear, { id: makeId('ben'), name: `Benefit: ${item}`, notes: `${activeCareer.name} mustering out`, qty: 1 }],
    });
    const msg = `Mustering Out Benefit (${activeCareer.name}): ${item}${shareMatch ? ` (Total Ship Shares: ${nextShares})` : ''}.`;
    setLastRollBanner(msg);
    await onBroadcastLifepath('MUSTERING OUT // BENEFIT', `${character.name}: ${msg}`);
  };

  const selectedPkg =
    SKILL_PACKAGES.find((p) => p.id === (snapshot.meta.selectedSkillPackage || 'starship_crew')) ??
    SKILL_PACKAGES[0];

  return (
    <div className="stack-md">
      {/* Header & Quick Preset Importer */}
      <div className="card card-accent stack-sm">
        <div className="row-between">
          <div>
            <h2 className="section-title">
              <Sparkles size={15} /> SESSION 0 // LIFEPATH COPILOT
            </h2>
            <p className="helper-text" style={{ fontSize: '0.82rem' }}>
              Permissive MgT2e (2022) guide — jump to any step or manually edit any stat/skill at any time.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={async () => {
              await onUpdateCharacter({ ...character, lifepathComplete: true });
              onFinishToSheet();
            }}
            id="finish-lifepath-btn"
          >
            <CheckCircle2 size={14} /> OPEN LIVE SHEET
          </button>
        </div>

        {/* Step Pills (All unlocked!) */}
        <div className="tab-strip">
          {(
            [
              ['STATS', '1. UPP'],
              ['BACKGROUND', '2. BG & UNI'],
              ['CAREERS', '3. CAREERS'],
              ['CONNECTIONS', '4. CONNECTIONS'],
              ['MUSTER', '5. MUSTER OUT'],
            ] as Array<[WizardStep, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`tab-chip ${step === id ? 'active' : ''}`}
              onClick={() => setStep(id)}
              id={`s0-step-${id.toLowerCase()}`}
            >
              {label}
            </button>
          ))}
        </div>

        {lastRollBanner && (
          <div className="status-ticker" style={{ borderColor: 'var(--border-amber)' }}>
            <span>{lastRollBanner}</span>
            {(lastMishapText || lastEventText) && (
              <button
                type="button"
                className="btn btn-amber btn-sm"
                disabled={ariaBusy}
                onClick={() => void onAriaReact(`${character.name} (${activeCareer.name}): ${lastMishapText || lastEventText}`)}
                id="aria-s0-react-btn"
              >
                <Bot size={13} /> {ariaBusy ? 'A.R.I.A...' : 'A.R.I.A. REACT'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* STEP 1: IDENTITY & UPP */}
      {step === 'STATS' && (
        <div className="card stack-md">
          <div className="row-between">
            <span className="section-title">
              <UserCheck size={14} /> IDENTITY &amp; CHARACTERISTICS (UPP)
            </span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void rollAllStats()} id="roll-all-upp-btn">
              <Dices size={14} /> ROLL 2D6 × 6 LIVE
            </button>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="s0-char-name">Traveller Name</label>
              <input
                id="s0-char-name"
                className="input"
                value={character.name}
                onChange={(e) => void onUpdateCharacter({ ...character, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="s0-homeworld">Homeworld</label>
              <input
                id="s0-homeworld"
                className="input"
                value={character.homeworld}
                onChange={(e) => void onUpdateCharacter({ ...character, homeworld: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label>Portrait Token</label>
            <div className="row-wrap">
              {TOKEN_CHOICES.map((tok) => (
                <button
                  key={tok.url}
                  type="button"
                  className={`tab-chip ${character.avatarUrl === tok.url ? 'active' : ''}`}
                  onClick={() => void onUpdateCharacter({ ...character, avatarUrl: tok.url })}
                >
                  <img src={tok.url} alt={tok.label} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                  {tok.label}
                </button>
              ))}
            </div>
          </div>

          <div className="upp-grid">
            {UPP_KEYS.map((key) => {
              const score = character.upp[key].max;
              const dm = characteristicDM(score);
              return (
                <div key={key} className="upp-cell">
                  <span className="upp-label">{key}</span>
                  <span className="upp-score">{score}</span>
                  <span className={`upp-dm ${dm < 0 ? 'neg' : ''}`}>{formatDM(dm)}</span>
                  <div className="row-wrap" style={{ gap: 4, marginTop: 4 }}>
                    <button type="button" className="btn btn-sm" onClick={() => void setUppValue(key, score - 1)}>
                      -
                    </button>
                    <button type="button" className="btn btn-sm" onClick={() => void setUppValue(key, score + 1)}>
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="divider" />
          <div className="stack-sm">
            <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              OR QUICK-IMPORT A RIMWARD VERGE PRESET CREW DOSSIER:
            </span>
            <div className="row-wrap">
              {PRESET_CREW_TEMPLATES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => void applyPresetTemplate(p.name)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BACKGROUND & PRE-CAREER EDUCATION */}
      {step === 'BACKGROUND' && (
        <div className="card stack-md">
          <div>
            <span className="section-title">
              <GraduationCap size={14} /> BACKGROUND SKILLS (PICK {bgAllowed} AT LEVEL 0)
            </span>
            <p className="helper-text" style={{ fontSize: '0.82rem', marginTop: 4 }}>
              MgT2e formula: EDU DM ({formatDM(characteristicDM(character.upp.EDU.max))}) + 3 = {bgAllowed} Level-0 background skills. Tap to grant:
            </p>
          </div>

          <div className="row-wrap">
            {BACKGROUND_SKILLS.map((sk) => {
              const owned = character.skills[sk] !== undefined;
              return (
                <button
                  key={sk}
                  type="button"
                  className={`tab-chip ${owned ? 'active' : ''}`}
                  onClick={() => void grantSkill(sk, 0)}
                >
                  {owned ? `✓ ${sk} ${character.skills[sk]}` : `+ ${sk} 0`}
                </button>
              );
            })}
          </div>

          <div className="divider" />
          <span className="section-title amber">
            <GraduationCap size={14} /> OPTIONAL PRE-CAREER EDUCATION (AGE 18 → 22)
          </span>
          <div className="grid-2">
            {PRE_CAREER_OPTIONS.map((pre) => (
              <div key={pre.id} className="card" style={{ background: 'var(--bg-elevated)', padding: 11 }}>
                <div className="row-between">
                  <strong>{pre.name}</strong>
                  <span className="badge mono">
                    Entry {pre.entry.stat} {pre.entry.target}+
                  </span>
                </div>
                <p className="helper-text" style={{ fontSize: '0.8rem', margin: '6px 0' }}>
                  {pre.honorsBonus}
                </p>
                <button
                  type="button"
                  className="btn btn-amber btn-sm"
                  onClick={() => void rollPreCareer(pre.id)}
                >
                  <Dices size={13} /> ROLL ADMISSION &amp; GRADUATION
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: CAREER TERMS */}
      {step === 'CAREERS' && (
        <div className="card stack-md">
          <div className="row-between">
            <span className="section-title">
              <Briefcase size={14} /> TERM {character.terms.length + 1} • AGE {character.age}
            </span>
            <span className="badge badge-amber">
              Prior Careers: {priorDistinctCareers} (Qual DM: -{priorDistinctCareers})
            </span>
          </div>

          {/* 12 Careers Selector */}
          <div className="row-wrap">
            {MGT2E_CAREERS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`tab-chip ${activeCareer.id === c.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCareerId(c.id);
                  setSelectedAssignmentId(c.assignments[0].id);
                  setQualFailed(false);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Assignment Selector */}
          <div className="grid-2">
            {activeCareer.assignments.map((asg) => (
              <button
                key={asg.id}
                type="button"
                className="card"
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: 10,
                  borderColor:
                    activeAssignment.id === asg.id ? 'var(--accent-phosphor)' : 'var(--border-subtle)',
                  background:
                    activeAssignment.id === asg.id ? 'var(--accent-phosphor-soft)' : 'var(--bg-elevated)',
                }}
                onClick={() => setSelectedAssignmentId(asg.id)}
              >
                <div className="row-between">
                  <strong>{asg.name}</strong>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
                    Surv {asg.survival.stat} {asg.survival.target}+ • Adv {asg.advancement.stat}{' '}
                    {asg.advancement.target}+
                  </span>
                </div>
                <p className="helper-text" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  {asg.description}
                </p>
              </button>
            ))}
          </div>

          {/* Term Roll Buttons */}
          <div className="row-wrap">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void rollQualification()} id="s0-roll-qual">
              <Dices size={13} /> 1. QUALIFY (
              {activeCareer.qualification
                ? `${activeCareer.qualification.stat} ${activeCareer.qualification.target}+`
                : 'AUTO'}
              )
            </button>

            {qualFailed && (
              <>
                <button
                  type="button"
                  className="btn btn-amber btn-sm"
                  disabled={character.draftUsed}
                  onClick={() => void enterTheDraft()}
                >
                  {character.draftUsed ? 'DRAFT ALREADY USED' : 'ENTER THE DRAFT (1D6)'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setSelectedCareerId('drifter');
                    setSelectedAssignmentId('scavenger');
                    setQualFailed(false);
                  }}
                >
                  SWITCH TO DRIFTER (AUTO)
                </button>
              </>
            )}

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => void applyBasicTraining()}
              id="s0-basic-training"
            >
              2. BASIC TRAINING ({character.terms.length === 0 ? 'ALL 6 @ 0' : 'PICK 1 BELOW'})
            </button>

            <button type="button" className="btn btn-amber btn-sm" onClick={() => void rollSurvival()} id="s0-roll-surv">
              <HeartPulse size={13} /> 3. SURVIVAL ({activeAssignment.survival.stat}{' '}
              {activeAssignment.survival.target}+)
            </button>

            <button type="button" className="btn btn-sm" onClick={() => void rollCareerEvent()} id="s0-roll-event">
              4. CAREER EVENT (2D6)
            </button>

            <button type="button" className="btn btn-sm" onClick={() => void rollLifeEvent()}>
              LIFE EVENT (2D6)
            </button>

            {activeCareer.isMilitary && !isOfficer && (
              <button type="button" className="btn btn-amber btn-sm" onClick={() => void rollCommission()}>
                <Award size={13} /> COMMISSION (SOC 8+)
              </button>
            )}

            <button type="button" className="btn btn-primary btn-sm" onClick={() => void rollAdvancement()} id="s0-roll-adv">
              5. ADVANCE ({activeAssignment.advancement.stat} {activeAssignment.advancement.target}+)
            </button>

            {character.terms.length >= 3 && (
              <button type="button" className="btn btn-alert btn-sm" onClick={() => void rollAging()}>
                <AlertTriangle size={13} /> AGING (TERM {character.terms.length + 1})
              </button>
            )}

            {lastMishapText && (
              <button type="button" className="btn btn-alert btn-sm" onClick={() => void rollInjuryAndMedical()}>
                ROLL INJURY TABLE ({activeCareer.medicalCoverage}% MED COV)
              </button>
            )}
          </div>

          {/* Skill Training Chips */}
          <div className="stack-sm">
            <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--accent-phosphor)' }}>
              TAP ANY SKILL / STAT TO APPLY (+1):
            </span>
            <div className="row-wrap">
              {getBasicTrainingPool(activeCareer, activeAssignment.id).map((sk) => (
                <button
                  key={`svc-${sk}`}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => void grantSkill(sk)}
                >
                  <Plus size={12} /> {sk} (Svc)
                </button>
              ))}
              {activeAssignment.specialistSkills.map((sk, i) => (
                <button
                  key={`spc-${sk}-${i}`}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => void grantSkill(sk)}
                >
                  <Plus size={12} /> {sk} (Spec)
                </button>
              ))}
              {activeCareer.personalDev.map((sk, i) => (
                <button
                  key={`per-${sk}-${i}`}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => void grantSkill(sk)}
                >
                  <Plus size={12} /> {sk} (Pers)
                </button>
              ))}
              {character.upp.EDU.max >= activeCareer.advancedEduMinEdu &&
                activeCareer.advancedEdu.map((sk, i) => (
                  <button
                    key={`adv-${sk}-${i}`}
                    type="button"
                    className="btn btn-amber btn-sm"
                    onClick={() => void grantSkill(sk)}
                  >
                    <Plus size={12} /> {sk} (Adv)
                  </button>
                ))}
            </div>
          </div>

          <div className="row-wrap">
            <input
              className="input"
              style={{ flex: 1 }}
              value={termLogNote}
              onChange={(e) => setTermLogNote(e.target.value)}
              placeholder="Optional term story note (e.g. 'Smuggled grain past 404th patrol')..."
            />
            <button type="button" className="btn btn-primary" onClick={() => void commitTerm()} id="s0-commit-term">
              COMMIT TERM (+4 YRS)
            </button>
          </div>

          {character.terms.length > 0 && (
            <div className="stack-sm">
              <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                SERVICE RECORD ({character.terms.length} TERMS):
              </span>
              {character.terms.map((t) => (
                <div key={t.id} className="feed-item kind-LIFEPATH" style={{ padding: 8 }}>
                  <div className="feed-meta">
                    <strong>
                      Term {t.termNumber} (Age {t.ageStart}): {t.careerName} — {t.assignment}
                    </strong>
                    <span>
                      {t.rankTitle} {t.survived ? '' : '• MISHAP'}
                    </span>
                  </div>
                  {(t.event || t.mishap || t.notes) && (
                    <p className="helper-text" style={{ fontSize: '0.82rem' }}>
                      {[t.event, t.mishap, t.notes].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: LIVE CONNECTIONS RULE */}
      {step === 'CONNECTIONS' && (
        <div className="card stack-md">
          <div className="row-between">
            <span className="section-title">
              <Link2 size={14} /> LIVE CREW CONNECTIONS ({character.connections.length}/2)
            </span>
            <span className="badge badge-green">Max 2 Connections • +1 Skill Each (Max Lv 3)</span>
          </div>
          <p className="helper-text" style={{ fontSize: '0.84rem' }}>
            Link one of your lifepath events with a teammate in the lobby right now to forge shared history and gain a bonus skill!
          </p>

          {otherCrewChars.length === 0 ? (
            <div className="card" style={{ background: 'var(--bg-elevated)' }}>
              <p className="helper-text">
                Waiting for another player to join the campaign lobby so you can link a Connection. (Or open a second browser tab in Sandbox mode to test live!)
              </p>
            </div>
          ) : (
            <div className="stack-sm">
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="conn-partner">Crewmate</label>
                  <select
                    id="conn-partner"
                    className="select"
                    value={connPartnerId || otherCrewChars[0].id}
                    onChange={(e) => setConnPartnerId(e.target.value)}
                  >
                    {otherCrewChars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.ownerName})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="conn-skill">Bonus Skill (+1, max Lv 3)</label>
                  <input
                    id="conn-skill"
                    className="input"
                    value={connSkill}
                    onChange={(e) => setConnSkill(e.target.value)}
                    placeholder="e.g. Pilot (Spacecraft)"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="conn-summary">Shared Backstory Moment</label>
                <input
                  id="conn-summary"
                  className="input"
                  value={connSummary}
                  onChange={(e) => setConnSummary(e.target.value)}
                  placeholder="e.g. Pulled each other out of a 404th customs raid at Zephyr"
                />
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!connSummary.trim()}
                onClick={() => void addConnection()}
                id="forge-connection-btn"
              >
                <Link2 size={14} /> FORGE CONNECTION &amp; CLAIM SKILL
              </button>
            </div>
          )}

          {character.connections.map((c) => (
            <div key={c.id} className="feed-item kind-LIFEPATH">
              <div className="feed-meta">
                <strong>↔ {c.partnerName}</strong>
                <span className="badge badge-green">+{c.skillChosen}</span>
              </div>
              <p className="feed-body" style={{ fontSize: '0.88rem' }}>
                {c.summary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* STEP 5: SKILL PACKAGE DRAFT & MUSTERING OUT */}
      {step === 'MUSTER' && (
        <div className="card stack-md">
          <span className="section-title">
            <Package size={14} /> ROUND-ROBIN SKILL PACKAGE DRAFT
          </span>
          <div className="row-wrap">
            {SKILL_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                className={`tab-chip ${selectedPkg.id === pkg.id ? 'active' : ''}`}
                onClick={() => void onClaimPackageSkill(pkg.id, '')}
              >
                {pkg.name.split(' (')[0]}
              </button>
            ))}
          </div>
          <p className="helper-text" style={{ fontSize: '0.82rem' }}>
            {selectedPkg.description} Take turns clicking 1 skill at Level 1 so the whole *Lucky Break* bridge is covered:
          </p>
          <div className="row-wrap">
            {selectedPkg.skills.map((sk) => {
              const claimedBy = snapshot.meta.claimedPackageSkills?.[sk];
              return (
                <button
                  key={sk}
                  type="button"
                  className={`btn btn-sm ${claimedBy ? '' : 'btn-amber'}`}
                  onClick={async () => {
                    await grantSkill(sk, 1);
                    await onClaimPackageSkill(selectedPkg.id, sk);
                  }}
                >
                  {sk} {claimedBy ? `(${claimedBy})` : '→ CLAIM LV 1'}
                </button>
              );
            })}
          </div>

          <div className="divider" />

          <div className="row-between">
            <span className="section-title amber">
              <Award size={14} /> MUSTERING OUT ({activeCareer.name.toUpperCase()})
            </span>
            <span className="badge mono">
              Cash Rolls: {character.cashRollsUsed}/3 • Cr {character.credits.toLocaleString()}
            </span>
          </div>

          <div className="row-wrap">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={character.cashRollsUsed >= 3}
              onClick={() => void rollMusteringCash()}
              id="s0-muster-cash"
            >
              <Dices size={13} /> ROLL CASH TABLE ({3 - character.cashRollsUsed} LEFT)
            </button>
            <button
              type="button"
              className="btn btn-amber btn-sm"
              onClick={() => void rollMusteringBenefit()}
              id="s0-muster-benefit"
            >
              <Dices size={13} /> ROLL BENEFIT TABLE
            </button>
          </div>

          <div className="card" style={{ background: 'var(--bg-elevated)', padding: 11 }}>
            <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--accent-phosphor)' }}>
              LUCKY BREAK SHIP-SHARE HOUSE RULE
            </div>
            <p className="helper-text" style={{ marginTop: 4 }}>
              {shipShareConversion.summary}
            </p>
            {character.medicalDebt > 0 && (
              <p className="mono" style={{ color: 'var(--accent-alert)', fontSize: '0.8rem', margin: '6px 0 0' }}>
                Outstanding Medical Debt: Cr {character.medicalDebt.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
