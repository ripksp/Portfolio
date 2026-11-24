import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  Eye,
  FileText,
  Lock,
  Send,
  Shield,
  Sparkles,
  ThumbsUp,
  Users,
} from 'lucide-react';
import { ALL_STANDARD_SKILLS } from '../data/mgt2eCareers';
import { characteristicDM, formatDM, rollTraveller2D6 } from '../data/mgt2eRules';
import { makeId } from '../services/campaignStore';
import type {
  CampaignSnapshot,
  DowntimeEntry,
  HandoutItem,
  TravellerCharacter,
  UserIdentity,
} from '../types/campaign';

interface IntelAndAsyncPanelProps {
  snapshot: CampaignSnapshot;
  user: UserIdentity;
  myCharacter: TravellerCharacter | null;
  isReferee: boolean;
  onOpenHandout: (handout: HandoutItem) => void;
  onToggleVote: (bulletinId: string, voted: boolean) => Promise<void>;
  onRunAutoDowntime: (entry: DowntimeEntry, updatedChar?: TravellerCharacter) => Promise<void>;
  onSubmitSpotlight: (prompt: string) => Promise<void>;
  onInspectCharacter?: (charId: string) => void;
  onOpenRefereeDrawer: () => void;
}

const ACTIVITIES: Array<{
  id: DowntimeEntry['activity'];
  label: string;
  desc: string;
  defaultSkill: string;
}> = [
  { id: 'STUDY', label: 'Study Skill (168h)', desc: 'MgT2e Jump-Space study week (+1 week toward next skill rank).', defaultSkill: 'Astrogation' },
  { id: 'REPAIR', label: 'Ship Maintenance', desc: 'Patch hull stress, tune J-Drive coils, or clear diagnostic faults.', defaultSkill: 'Mechanic' },
  { id: 'MEDBAY', label: 'Medbay Recovery', desc: 'Stabilize lingering wounds or check crew bio-scanners.', defaultSkill: 'Medic' },
  { id: 'HACK', label: 'Decrypt / Research', desc: 'Crack recovered data-slates or cross-check Rimward beacons.', defaultSkill: 'Electronics (Computers)' },
  { id: 'BROKER', label: 'Speculative Trade', desc: 'Hunt cargo margins and port fees before undocking.', defaultSkill: 'Broker' },
  { id: 'CAROUSE', label: 'Starport Rumors', desc: 'Work The Rusty Vent for leads on patrols and patrons.', defaultSkill: 'Streetwise' },
];

export const IntelAndAsyncPanel: React.FC<IntelAndAsyncPanelProps> = ({
  snapshot,
  user,
  myCharacter,
  isReferee,
  onOpenHandout,
  onToggleVote,
  onRunAutoDowntime,
  onSubmitSpotlight,
  onInspectCharacter,
  onOpenRefereeDrawer,
}) => {
  const [activity, setActivity] = useState<DowntimeEntry['activity']>('STUDY');
  const [skillChoice, setSkillChoice] = useState<string>('Astrogation');
  const [downtimeNote, setDowntimeNote] = useState<string>('');
  const [spotlightText, setSpotlightText] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const privateHandouts = Object.values(snapshot.myPrivate.handouts ?? {}).sort(
    (a, b) => b.revealedAt - a.revealedAt
  );
  const allCharacters = Object.values(snapshot.characters);

  const handleAutoDowntime = async () => {
    if (!myCharacter) return;
    setBusy(true);
    try {
      const skillLv = myCharacter.skills[skillChoice] ?? 0;
      const eduDm = characteristicDM(myCharacter.upp.EDU.current);
      const roll = rollTraveller2D6({
        modifier: skillLv + eduDm,
        difficulty: 8,
        skillName: skillChoice,
        statKey: 'EDU',
      });

      let updatedChar: TravellerCharacter | undefined;
      let summary = '';

      if (activity === 'STUDY') {
        const prevWeeks = myCharacter.studyProgress?.[skillChoice] ?? 0;
        const nextWeeks = roll.effect >= 0 ? prevWeeks + 1 : prevWeeks;
        updatedChar = {
          ...myCharacter,
          studyProgress: { ...(myCharacter.studyProgress ?? {}), [skillChoice]: nextWeeks },
        };
        summary =
          roll.effect >= 0
            ? `Completed a productive Jump-Space study week on ${skillChoice} (${nextWeeks} study weeks logged).`
            : `Distracted during ${skillChoice} study drills (Total ${roll.total} vs 8+); ${prevWeeks} weeks remain logged.`;
      } else {
        const actLabel = ACTIVITIES.find((a) => a.id === activity)?.label ?? activity;
        summary = `${actLabel} (${skillChoice}): ${roll.outcome} (Total ${roll.total}, Effect ${formatDM(roll.effect)}).${
          downtimeNote.trim() ? ` Note: ${downtimeNote.trim()}` : ''
        }`;
      }

      const entry: DowntimeEntry = {
        id: makeId('dt'),
        uid: user.uid,
        characterId: myCharacter.id,
        characterName: myCharacter.name,
        activity,
        skillUsed: skillChoice,
        summary,
        roll,
        timestamp: Date.now(),
      };

      await onRunAutoDowntime(entry, updatedChar);
      setDowntimeNote('');
    } finally {
      setBusy(false);
    }
  };

  const handleSpotlightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotlightText.trim()) return;
    setBusy(true);
    try {
      await onSubmitSpotlight(spotlightText.trim());
      setSpotlightText('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack-md">
      {isReferee && (
        <div className="card card-amber row-between">
          <div>
            <div className="section-title amber">
              <Shield size={15} /> REFEREE COMMAND DECK
            </div>
            <p className="helper-text" style={{ fontSize: '0.82rem' }}>
              Inject covert Mind-Virus directives, push handouts, tune A.R.I.A. Tier &amp; Canon Facts, or ping Discord.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-amber"
            onClick={onOpenRefereeDrawer}
            id="intel-open-referee-btn"
          >
            OPEN GM DECK
          </button>
        </div>
      )}

      {/* Handouts & NPC Dossiers */}
      <div className="card stack-sm">
        <div className="row-between">
          <span className="section-title">
            <FileText size={14} /> HANDOUTS &amp; NPC DOSSIERS ({snapshot.handouts.length + privateHandouts.length})
          </span>
        </div>

        {privateHandouts.length > 0 && (
          <div className="stack-sm">
            {privateHandouts.map((h) => (
              <div
                key={h.id}
                className="feed-item row-between"
                style={{ borderLeftColor: 'var(--accent-alert)', cursor: 'pointer' }}
                onClick={() => onOpenHandout(h)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onOpenHandout(h);
                }}
              >
                <div className="row-wrap" style={{ gap: 10 }}>
                  {h.imageUrl && <img src={h.imageUrl} alt={h.title} className="token-avatar" />}
                  <div>
                    <span className="badge badge-alert" style={{ marginBottom: 4 }}>
                      <Lock size={11} /> EYES ONLY
                    </span>
                    <div style={{ fontWeight: 600 }}>{h.title}</div>
                    {h.subtitle && <div className="helper-text" style={{ fontSize: '0.8rem' }}>{h.subtitle}</div>}
                  </div>
                </div>
                <button type="button" className="btn btn-sm btn-alert">
                  <Eye size={13} /> VIEW
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="stack-sm">
          {snapshot.handouts.map((h) => (
            <div
              key={h.id}
              className="feed-item row-between"
              style={{ cursor: 'pointer' }}
              onClick={() => onOpenHandout(h)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onOpenHandout(h);
              }}
            >
              <div className="row-wrap" style={{ gap: 10 }}>
                {h.imageUrl && <img src={h.imageUrl} alt={h.title} className="token-avatar" />}
                <div>
                  <span className="badge" style={{ marginBottom: 4 }}>
                    {h.category}
                  </span>
                  <div style={{ fontWeight: 600 }}>{h.title}</div>
                  {h.subtitle && <div className="helper-text" style={{ fontSize: '0.8rem' }}>{h.subtitle}</div>}
                </div>
              </div>
              <button type="button" className="btn btn-sm">
                <Eye size={13} /> READ
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Starport Bulletin & Crew Contract Vote */}
      <div className="card stack-sm">
        <div className="row-between">
          <span className="section-title amber">
            <BookOpen size={14} /> STARPORT BULLETIN &amp; CONTRACT VOTE
          </span>
          <span className="badge mono">{snapshot.meta.imperialDate}</span>
        </div>
        <p className="helper-text" style={{ fontSize: '0.82rem' }}>
          Vote on Patron jobs during the week so the Referee knows which lead to prep for next session!
        </p>
        {snapshot.bulletins.map((b) => {
          const voteCount = Object.keys(b.votes ?? {}).length;
          const iVoted = Boolean(b.votes?.[user.uid]);
          return (
            <article key={b.id} className="feed-item" style={{ borderLeftColor: 'var(--accent-amber)' }}>
              <div className="row-between">
                <strong>{b.title}</strong>
                <span className="badge badge-amber">{b.reward}</span>
              </div>
              <div className="helper-text" style={{ fontSize: '0.78rem', margin: '3px 0 6px' }}>
                Patron: {b.patron}
              </div>
              <p className="feed-body" style={{ fontSize: '0.9rem' }}>
                {b.summary}
              </p>
              <div className="row-between" style={{ marginTop: 8 }}>
                <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  CREW VOTES: {voteCount}
                </span>
                <button
                  type="button"
                  className={`btn btn-sm ${iVoted ? 'btn-primary' : ''}`}
                  onClick={() => void onToggleVote(b.id, !iVoted)}
                >
                  <ThumbsUp size={13} /> {iVoted ? 'VOTED' : 'VOTE FOR JOB'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Week-1 Async Jump-Space Downtime Hub */}
      <div className="card stack-sm">
        <div className="row-between">
          <span className="section-title">
            <Clock size={14} /> 168-HOUR JUMP-SPACE DOWNTIME (ASYNC)
          </span>
          <span className="badge badge-green">Instant Auto-Resolve</span>
        </div>

        <div className="row-wrap">
          {ACTIVITIES.map((act) => (
            <button
              key={act.id}
              type="button"
              className={`tab-chip ${activity === act.id ? 'active' : ''}`}
              onClick={() => {
                setActivity(act.id);
                setSkillChoice(act.defaultSkill);
              }}
            >
              {act.label}
            </button>
          ))}
        </div>

        <p className="helper-text" style={{ fontSize: '0.82rem' }}>
          {ACTIVITIES.find((a) => a.id === activity)?.desc}
        </p>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="dt-skill">Skill Used</label>
            <select
              id="dt-skill"
              className="select"
              value={skillChoice}
              onChange={(e) => setSkillChoice(e.target.value)}
            >
              {ALL_STANDARD_SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="dt-note">Optional Log Note</label>
            <input
              id="dt-note"
              className="input"
              value={downtimeNote}
              onChange={(e) => setDowntimeNote(e.target.value)}
              placeholder="What are you working on during Jump?"
            />
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy || !myCharacter}
          onClick={() => void handleAutoDowntime()}
          id="run-downtime-btn"
        >
          <Sparkles size={14} /> {busy ? 'LOGGING...' : 'EXECUTE DOWNTIME ROLL (+ A.R.I.A. LOG)'}
        </button>

        {snapshot.downtimeLog.length > 0 && (
          <div className="stack-sm" style={{ marginTop: 6 }}>
            <span className="mono" style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
              RECENT JUMP-SPACE LOGS:
            </span>
            {snapshot.downtimeLog.slice(0, 5).map((d) => (
              <div key={d.id} className="feed-item kind-DOWNTIME" style={{ padding: 8 }}>
                <div className="feed-meta">
                  <strong>{d.characterName}</strong>
                  <span>{d.activity}</span>
                </div>
                <p className="feed-body" style={{ fontSize: '0.86rem' }}>
                  {d.summary}
                </p>
                {d.ariaNote && (
                  <p className="helper-text" style={{ fontSize: '0.8rem', marginTop: 4, color: 'var(--accent-cyan)' }}>
                    A.R.I.A.: {d.ariaNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="divider" />

        {/* 1/Week Private Spotlight Action */}
        <form onSubmit={handleSpotlightSubmit} className="stack-sm">
          <span className="section-title amber" style={{ fontSize: '0.76rem' }}>
            <Lock size={13} /> WEEKLY SPOTLIGHT / SECRET INVESTIGATION (1 PER JUMP)
          </span>
          <p className="helper-text" style={{ fontSize: '0.8rem' }}>
            Submit one private between-session move to the Referee Inbox (secret contact, covert sabotage, solo sleuthing).
          </p>
          {snapshot.myPrivate.spotlight && (
            <div className="card card-amber" style={{ padding: 10, background: 'var(--bg-elevated)' }}>
              <div className="row-between">
                <span className="badge badge-amber">{snapshot.myPrivate.spotlight.status}</span>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  YOUR ACTIVE SPOTLIGHT
                </span>
              </div>
              <p className="feed-body" style={{ marginTop: 6, fontSize: '0.88rem' }}>
                {snapshot.myPrivate.spotlight.prompt}
              </p>
              {snapshot.myPrivate.spotlight.refereeReply && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="mono" style={{ fontSize: '0.73rem', color: 'var(--accent-phosphor)' }}>
                    REFEREE RULING (EYES ONLY):
                  </span>
                  <p className="feed-body" style={{ fontSize: '0.9rem', marginTop: 4 }}>
                    {snapshot.myPrivate.spotlight.refereeReply}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="row-wrap" style={{ flexWrap: 'nowrap' }}>
            <input
              className="input"
              value={spotlightText}
              onChange={(e) => setSpotlightText(e.target.value)}
              placeholder="e.g. Slip into Bay 67 maintenance ducts at 0200 to inspect K-REN's tether..."
            />
            <button type="submit" className="btn btn-amber btn-sm" disabled={busy || !spotlightText.trim()}>
              <Send size={13} /> SUBMIT
            </button>
          </div>
        </form>
      </div>

      {/* Party Crew Roster */}
      <div className="card stack-sm">
        <span className="section-title">
          <Users size={14} /> CREW ROSTER ({allCharacters.length})
        </span>
        {allCharacters.length === 0 ? (
          <p className="helper-text">No Travellers registered yet.</p>
        ) : (
          <div className="stack-sm">
            {allCharacters.map((c) => (
              <div key={c.id} className="feed-item row-between" style={{ padding: 9 }}>
                <div className="row-wrap" style={{ gap: 10 }}>
                  <img
                    src={c.avatarUrl || '/aegis/assets/tokens/token_starship_scout.png'}
                    alt={c.name}
                    className="token-avatar"
                  />
                  <div>
                    <strong>{c.name}</strong>{' '}
                    <span className="badge badge-green">{c.station}</span>
                    <div className="helper-text" style={{ fontSize: '0.78rem' }}>
                      {c.ownerName} • {c.archetype} • UPP{' '}
                      <span className="mono">
                        {c.upp.STR.current}-{c.upp.DEX.current}-{c.upp.END.current}-{c.upp.INT.current}-
                        {c.upp.EDU.current}-{c.upp.SOC.current}
                      </span>
                    </div>
                  </div>
                </div>
                {isReferee && onInspectCharacter && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onInspectCharacter(c.id)}
                  >
                    INSPECT
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
