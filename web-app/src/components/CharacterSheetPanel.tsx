import React, { useState } from 'react';
import {
  Crosshair,
  Dices,
  HeartPulse,
  Lock,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  User,
} from 'lucide-react';
import { ALL_STANDARD_SKILLS } from '../data/mgt2eCareers';
import {
  applyWoundCascade,
  characteristicDM,
  convertShipSharesToLuckyBreak,
  formatDM,
  rollTraveller2D6,
  rollWeaponDamage,
} from '../data/mgt2eRules';
import { makeId } from '../services/campaignStore';
import type {
  DiceMode,
  DiceRollPayload,
  ShipStation,
  TravellerCharacter,
  UppKey,
  WeaponItem,
} from '../types/campaign';

const UPP_KEYS: UppKey[] = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];
const STATIONS: ShipStation[] = ['UNASSIGNED', 'PILOT', 'COMMAND', 'ENGINEER', 'GUNNER', 'SENSORS'];

interface CharacterSheetPanelProps {
  character: TravellerCharacter;
  privateNotes: string;
  activeTaskChain: { dm: number; label: string } | null;
  onClearTaskChain: () => void;
  onUpdateCharacter: (next: TravellerCharacter) => Promise<void>;
  onSavePrivateNotes: (notes: string) => Promise<void>;
  onPostRoll: (title: string, body: string, roll: DiceRollPayload) => Promise<void>;
  onOpenSession0: () => void;
}

export const CharacterSheetPanel: React.FC<CharacterSheetPanelProps> = ({
  character,
  privateNotes,
  activeTaskChain,
  onClearTaskChain,
  onUpdateCharacter,
  onSavePrivateNotes,
  onPostRoll,
  onOpenSession0,
}) => {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [rollStat, setRollStat] = useState<UppKey>('DEX');
  const [rollDiff, setRollDiff] = useState<number>(8);
  const [rollMode, setRollMode] = useState<DiceMode>('NORMAL');
  const [extraMod, setExtraMod] = useState<number>(0);

  const [damageInput, setDamageInput] = useState<string>('5');
  const [targetArmorInput, setTargetArmorInput] = useState<string>('0');
  const [newSkillName, setNewSkillName] = useState<string>('Pilot (Spacecraft)');
  const [newWeaponName, setNewWeaponName] = useState('');
  const [newWeaponDmg, setNewWeaponDmg] = useState('3D6');
  const [notesDraft, setNotesDraft] = useState(privateNotes);

  // Determine wound status badge
  const zeroStats = (['STR', 'DEX', 'END'] as UppKey[]).filter((k) => character.upp[k].current <= 0).length;
  const anyDamaged = (['STR', 'DEX', 'END'] as UppKey[]).some((k) => character.upp[k].current < character.upp[k].max);
  const healthStatus =
    zeroStats >= 3 ? 'CRITICAL' : zeroStats === 2 ? 'UNCONSCIOUS' : anyDamaged ? 'WOUNDED' : 'OPERATIONAL';

  const handleTakeDamage = async () => {
    const dmg = Math.max(0, parseInt(damageInput, 10) || 0);
    if (dmg <= 0) return;
    const { nextUpp } = applyWoundCascade(character.upp, dmg);
    await onUpdateCharacter({ ...character, upp: nextUpp });
  };

  const handleFullHeal = async () => {
    const healed = { ...character.upp };
    for (const k of UPP_KEYS) {
      healed[k] = { max: healed[k].max, current: healed[k].max };
    }
    await onUpdateCharacter({ ...character, upp: healed, reactionPenalty: 0 });
  };

  const executeSkillRoll = async () => {
    if (!selectedSkill) return;
    const skillLv = character.skills[selectedSkill] ?? -3;
    const statDm = characteristicDM(character.upp[rollStat].current);
    const totalMod = skillLv + statDm + extraMod - character.reactionPenalty;
    const chainDm = activeTaskChain?.dm ?? 0;

    const roll = rollTraveller2D6({
      diceMode: rollMode,
      modifier: totalMod,
      taskChainDm: chainDm,
      difficulty: rollDiff,
      skillName: selectedSkill,
      statKey: rollStat,
    });

    await onPostRoll(
      `SKILL CHECK // ${selectedSkill.toUpperCase()} (${rollStat})`,
      `${character.name} rolled ${selectedSkill} ${skillLv} + ${rollStat} ${formatDM(statDm)}${
        character.reactionPenalty > 0 ? ` - Reaction ${character.reactionPenalty}` : ''
      }${activeTaskChain ? ` [Chained from ${activeTaskChain.label}]` : ''}.`,
      roll
    );
    if (activeTaskChain) onClearTaskChain();
    setSelectedSkill(null);
  };

  const executeWeaponAttack = async (weapon: WeaponItem) => {
    const skillName = weapon.skill || 'Gun Combat (Slug)';
    const skillLv = character.skills[skillName] ?? -3;
    const statKey: UppKey = skillName.toLowerCase().includes('melee') ? 'STR' : 'DEX';
    const statDm = characteristicDM(character.upp[statKey].current);
    const totalMod = skillLv + statDm - character.reactionPenalty;

    const atkRoll = rollTraveller2D6({
      diceMode: rollMode,
      modifier: totalMod,
      taskChainDm: activeTaskChain?.dm ?? 0,
      difficulty: 8,
      skillName,
      statKey,
    });

    const targetArmor = Math.max(0, parseInt(targetArmorInput, 10) || 0);
    const hit = atkRoll.effect >= 0;
    const dmgRes = hit
      ? rollWeaponDamage(weapon.damage, atkRoll.effect, targetArmor, weapon.ap ?? 0)
      : null;

    const enriched: DiceRollPayload = {
      ...atkRoll,
      weaponName: weapon.name,
      damageTotal: dmgRes?.finalDamage,
    };

    const body = hit && dmgRes
      ? `${character.name} HITS with ${weapon.name}! Damage [${dmgRes.rawDice.join('+')}${
          dmgRes.flatMod ? formatDM(dmgRes.flatMod) : ''
        }] + Effect ${dmgRes.effectBonus} - Armor ${dmgRes.effectiveArmor} = ${dmgRes.finalDamage} DMG.`
      : `${character.name} fires ${weapon.name} (${skillName}) — MISSES (Effect ${formatDM(atkRoll.effect)}).`;

    await onPostRoll(`COMBAT // ${weapon.name.toUpperCase()}`, body, enriched);
    if (activeTaskChain) onClearTaskChain();
  };

  const addSkill = async () => {
    const clean = newSkillName.trim();
    if (!clean) return;
    await onUpdateCharacter({
      ...character,
      skills: { ...character.skills, [clean]: character.skills[clean] ?? 0 },
    });
  };

  const adjustSkill = async (name: string, delta: number) => {
    const next = (character.skills[name] ?? 0) + delta;
    const copy = { ...character.skills };
    if (next < 0) delete copy[name];
    else copy[name] = Math.min(5, next);
    await onUpdateCharacter({ ...character, skills: copy });
  };

  const addWeapon = async () => {
    if (!newWeaponName.trim()) return;
    const nextWeapon: WeaponItem = {
      id: makeId('w'),
      name: newWeaponName.trim(),
      damage: newWeaponDmg.trim() || '3D6',
      range: '20m',
      skill: 'Gun Combat (Slug)',
    };
    await onUpdateCharacter({
      ...character,
      weapons: [...character.weapons, nextWeapon],
    });
    setNewWeaponName('');
  };

  const shipSharesInfo = convertShipSharesToLuckyBreak(character.shipShares);

  return (
    <div className="stack-md">
      {/* Character Identity & Station Claim */}
      <div className="card card-accent stack-sm">
        <div className="row-between">
          <div className="row-wrap" style={{ gap: 12 }}>
            <img
              src={character.avatarUrl || '/aegis/assets/tokens/token_starship_scout.png'}
              alt={character.name}
              className="token-avatar token-avatar-lg"
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{character.name}</h2>
              <p className="helper-text" style={{ fontSize: '0.84rem' }}>
                {character.archetype} • Age {character.age} • {character.homeworld}
              </p>
              <div className="row-wrap" style={{ marginTop: 6, gap: 6 }}>
                <span
                  className={`badge ${
                    healthStatus === 'OPERATIONAL'
                      ? 'badge-green'
                      : healthStatus === 'WOUNDED'
                      ? 'badge-amber'
                      : 'badge-alert'
                  }`}
                >
                  <HeartPulse size={12} /> {healthStatus}
                </span>
                <span className="badge mono">Cr {character.credits.toLocaleString()}</span>
                <span className="badge mono">ARMOR {character.armorRating}</span>
              </div>
            </div>
          </div>

          <button type="button" className="btn btn-amber btn-sm" onClick={onOpenSession0} id="reopen-s0-btn">
            <Sparkles size={13} /> SESSION 0
          </button>
        </div>

        {/* Lucky Break Station Claim */}
        <div className="row-wrap" style={{ paddingTop: 4 }}>
          <span className="mono" style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
            BRIDGE STATION:
          </span>
          {STATIONS.map((st) => (
            <button
              key={st}
              type="button"
              className={`tab-chip ${character.station === st ? 'active' : ''}`}
              onClick={() => void onUpdateCharacter({ ...character, station: st })}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Active Task Chain Banner */}
      {activeTaskChain && (
        <div className="card card-amber row-between" style={{ padding: 10 }}>
          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
            TASK CHAIN ACTIVE: {activeTaskChain.label} — will auto-apply to your next roll!
          </span>
          <button type="button" className="btn btn-sm" onClick={onClearTaskChain}>
            CLEAR
          </button>
        </div>
      )}

      {/* UPP & Wound Cascade */}
      <div className="card stack-sm">
        <div className="row-between">
          <span className="section-title">
            <User size={14} /> UPP &amp; WOUND CASCADE (END → DEX/STR)
          </span>
          <div className="row-wrap" style={{ gap: 6 }}>
            <input
              type="number"
              className="input mono"
              style={{ width: 64, padding: '4px 8px' }}
              value={damageInput}
              onChange={(e) => setDamageInput(e.target.value)}
              aria-label="Incoming damage"
            />
            <button type="button" className="btn btn-alert btn-sm" onClick={() => void handleTakeDamage()} id="apply-damage-btn">
              TAKE DMG
            </button>
            <button type="button" className="btn btn-sm" onClick={() => void handleFullHeal()} id="full-heal-btn">
              <RotateCcw size={13} /> HEAL
            </button>
          </div>
        </div>

        <div className="upp-grid">
          {UPP_KEYS.map((key) => {
            const stat = character.upp[key];
            const dm = characteristicDM(stat.current);
            const cls =
              stat.current <= 0 ? 'upp-cell zeroed' : stat.current < stat.max ? 'upp-cell damaged' : 'upp-cell';
            return (
              <div key={key} className={cls}>
                <span className="upp-label">{key}</span>
                <span className="upp-score">
                  {stat.current}
                  {stat.current !== stat.max && (
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>/{stat.max}</span>
                  )}
                </span>
                <span className={`upp-dm ${dm < 0 ? 'neg' : ''}`}>{formatDM(dm)}</span>
                <div className="row-wrap" style={{ gap: 3, marginTop: 3 }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ padding: '2px 6px' }}
                    onClick={() =>
                      void onUpdateCharacter({
                        ...character,
                        upp: {
                          ...character.upp,
                          [key]: { ...stat, current: Math.max(0, stat.current - 1) },
                        },
                      })
                    }
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ padding: '2px 6px' }}
                    onClick={() =>
                      void onUpdateCharacter({
                        ...character,
                        upp: {
                          ...character.upp,
                          [key]: {
                            max: Math.max(stat.max, stat.current + 1),
                            current: Math.min(15, stat.current + 1),
                          },
                        },
                      })
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills + 1-Click Task Roller */}
      <div className="card stack-sm">
        <div className="row-between">
          <span className="section-title">
            <Dices size={14} /> SKILLS — TAP ANY SKILL TO ROLL
          </span>
          <div className="row-wrap" style={{ gap: 6 }}>
            <select
              className="select"
              style={{ width: 170, padding: '5px 8px', fontSize: '0.82rem' }}
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              aria-label="Add skill"
            >
              {ALL_STANDARD_SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-sm" onClick={() => void addSkill()}>
              <Plus size={13} /> ADD
            </button>
          </div>
        </div>

        <div className="skill-grid">
          {Object.entries(character.skills)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([skill, lv]) => (
              <div
                key={skill}
                className="skill-row"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedSkill(skill)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedSkill(skill);
                }}
              >
                <span className="skill-name">{skill}</span>
                <div className="row-wrap" style={{ gap: 4 }}>
                  <span className="skill-level">{lv}</span>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ padding: '1px 6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      void adjustSkill(skill, 1);
                    }}
                    title="Increase skill level"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Inline Skill Roll Configurator */}
        {selectedSkill && (
          <div className="card card-amber stack-sm" style={{ marginTop: 8, background: 'var(--bg-elevated)' }}>
            <div className="row-between">
              <strong className="mono" style={{ color: 'var(--accent-amber)' }}>
                ROLL: {selectedSkill} ({character.skills[selectedSkill] ?? 0})
              </strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedSkill(null)}>
                CANCEL
              </button>
            </div>
            <div className="row-wrap">
              {UPP_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`tab-chip ${rollStat === k ? 'active' : ''}`}
                  onClick={() => setRollStat(k)}
                >
                  {k} {formatDM(characteristicDM(character.upp[k].current))}
                </button>
              ))}
            </div>
            <div className="row-wrap">
              {(['NORMAL', 'BOON', 'BANE'] as DiceMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`tab-chip ${rollMode === m ? 'active' : ''}`}
                  onClick={() => setRollMode(m)}
                >
                  {m}
                </button>
              ))}
              <select
                className="select"
                style={{ width: 150, padding: '5px 8px', fontSize: '0.82rem' }}
                value={rollDiff}
                onChange={(e) => setRollDiff(parseInt(e.target.value, 10))}
              >
                <option value={4}>Easy (4+)</option>
                <option value={6}>Routine (6+)</option>
                <option value={8}>Average (8+)</option>
                <option value={10}>Difficult (10+)</option>
                <option value={12}>Very Difficult (12+)</option>
                <option value={14}>Formidable (14+)</option>
              </select>
              <input
                type="number"
                className="input mono"
                style={{ width: 72, padding: '5px 8px' }}
                value={extraMod}
                onChange={(e) => setExtraMod(parseInt(e.target.value, 10) || 0)}
                title="Extra DM"
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void executeSkillRoll()}
                id="confirm-skill-roll-btn"
              >
                <Dices size={14} /> ROLL TO TABLE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Combat, Weapons & Reactions */}
      <div className="card stack-sm">
        <div className="row-between">
          <span className="section-title">
            <Swords size={14} /> WEAPONS, ARMOR &amp; REACTIONS
          </span>
          <div className="row-wrap" style={{ gap: 6 }}>
            <span className="badge badge-amber">
              <Shield size={12} /> REACTIONS: -{character.reactionPenalty} DM
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                void onUpdateCharacter({ ...character, reactionPenalty: character.reactionPenalty + 1 })
              }
            >
              +1 DODGE/PARRY
            </button>
            {character.reactionPenalty > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => void onUpdateCharacter({ ...character, reactionPenalty: 0 })}
              >
                RESET
              </button>
            )}
          </div>
        </div>

        <div className="row-wrap" style={{ gap: 8 }}>
          <span className="helper-text" style={{ fontSize: '0.82rem' }}>
            Target Armor (for damage calc):
          </span>
          <input
            type="number"
            className="input mono"
            style={{ width: 68, padding: '4px 8px' }}
            value={targetArmorInput}
            onChange={(e) => setTargetArmorInput(e.target.value)}
          />
          <span className="helper-text" style={{ fontSize: '0.82rem' }}>
            Your Armor: <strong>{character.armorName} ({character.armorRating})</strong>
          </span>
        </div>

        <div className="stack-sm">
          {character.weapons.map((w) => (
            <div key={w.id} className="feed-item row-between" style={{ padding: 10 }}>
              <div>
                <strong>{w.name}</strong>{' '}
                <span className="badge mono">{w.damage}</span>{' '}
                {w.ap ? <span className="badge badge-amber">AP {w.ap}</span> : null}
                <div className="helper-text" style={{ fontSize: '0.8rem' }}>
                  Range: {w.range} {w.traits ? `• ${w.traits}` : ''} • Skill: {w.skill || 'Gun Combat (Slug)'}
                </div>
              </div>
              <div className="row-wrap" style={{ gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => void executeWeaponAttack(w)}
                >
                  <Crosshair size={13} /> ATTACK
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    void onUpdateCharacter({
                      ...character,
                      weapons: character.weapons.filter((item) => item.id !== w.id),
                    })
                  }
                  aria-label={`Remove ${w.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="row-wrap">
          <input
            className="input"
            style={{ flex: 1 }}
            value={newWeaponName}
            onChange={(e) => setNewWeaponName(e.target.value)}
            placeholder="Add weapon (e.g. Gauss Rifle)"
          />
          <input
            className="input mono"
            style={{ width: 96 }}
            value={newWeaponDmg}
            onChange={(e) => setNewWeaponDmg(e.target.value)}
            placeholder="4D6"
          />
          <button type="button" className="btn btn-sm" onClick={() => void addWeapon()}>
            <Plus size={13} /> ADD
          </button>
        </div>
      </div>

      {/* Finances, Bio & Private Eyes-Only Notes */}
      <div className="card stack-sm">
        <span className="section-title">
          <Lock size={14} /> FINANCES, DOSSIER &amp; PRIVATE NOTES
        </span>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="char-credits">Personal Credits (Cr)</label>
            <input
              id="char-credits"
              type="number"
              className="input mono"
              value={character.credits}
              onChange={(e) =>
                void onUpdateCharacter({ ...character, credits: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>
          <div className="field">
            <label>Ship Shares / Debt</label>
            <p className="helper-text" style={{ fontSize: '0.82rem', paddingTop: 6 }}>
              {shipSharesInfo.summary}
            </p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="char-bio">Public Bio &amp; Hooks</label>
          <textarea
            id="char-bio"
            className="textarea"
            value={character.bio}
            onChange={(e) => void onUpdateCharacter({ ...character, bio: e.target.value })}
            placeholder="Service history, reputation, connections..."
          />
        </div>

        <div className="field">
          <label htmlFor="char-private-notes">Eyes-Only Private Notes (Only You + Referee Can Read)</label>
          <textarea
            id="char-private-notes"
            className="textarea"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Secret motives, suspicions, mind-virus diary..."
          />
          <div className="row-between">
            <span className="helper-text" style={{ fontSize: '0.78rem' }}>
              Stored in isolated `private/$uid/notes` path.
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => void onSavePrivateNotes(notesDraft)}
              id="save-private-notes-btn"
            >
              SAVE PRIVATE NOTES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
