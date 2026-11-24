import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Bot,
  Calendar,
  FilePlus2,
  Inbox,
  Send,
  Shield,
  Skull,
  X,
} from 'lucide-react';
import { buildMindVirusPreset, dispatchDiscordPing, type MindVirusPreset } from '../services/ariaClient';
import { makeId } from '../services/campaignStore';
import type {
  BulletinItem,
  CampaignMode,
  CampaignSnapshot,
  HandoutItem,
  PsychDirective,
} from '../types/campaign';

interface RefereeDrawerProps {
  snapshot: CampaignSnapshot;
  isDemoMode: boolean;
  onClose: () => void;
  onUpdateMeta: (patch: Partial<CampaignSnapshot['meta']>) => Promise<void>;
  onUpdateRefereeOnly: (patch: Partial<NonNullable<CampaignSnapshot['refereeOnly']>>) => Promise<void>;
  onInjectDirective: (targetUid: string, directive: PsychDirective) => Promise<void>;
  onClearDirective: (targetUid: string, directiveId: string) => Promise<void>;
  onPushHandout: (handout: HandoutItem, targetUid?: string | null) => Promise<void>;
  onPostBulletin: (bulletin: BulletinItem) => Promise<void>;
  onResolveSpotlight: (targetUid: string, reply: string) => Promise<void>;
}

export const RefereeDrawer: React.FC<RefereeDrawerProps> = ({
  snapshot,
  isDemoMode,
  onClose,
  onUpdateMeta,
  onUpdateRefereeOnly,
  onInjectDirective,
  onClearDirective,
  onPushHandout,
  onPostBulletin,
  onResolveSpotlight,
}) => {
  const players = useMemo(
    () => Object.values(snapshot.members).filter((m) => m.uid !== snapshot.meta.refereeUid),
    [snapshot.members, snapshot.meta.refereeUid]
  );

  // Campaign status state
  const [imperialDate, setImperialDate] = useState(snapshot.meta.imperialDate);
  const [mode, setMode] = useState<CampaignMode>(snapshot.meta.mode);
  const [statusBanner, setStatusBanner] = useState(snapshot.meta.statusBanner);
  const [nextSession, setNextSession] = useState(snapshot.meta.nextSessionLabel);

  // Mind-Virus Injector state
  const [targetUid, setTargetUid] = useState(players[0]?.uid ?? '');
  const [virusTitle, setVirusTitle] = useState('STAGE-1 CHIMERA NEURO-PARASITE');
  const [virusBody, setVirusBody] = useState('');

  // A.R.I.A. Tier & Canon Fact Sheet
  const [canonDraft, setCanonDraft] = useState(
    (snapshot.refereeOnly?.canonFacts ?? []).join('\n')
  );

  // Handout Pusher
  const [handoutTitle, setHandoutTitle] = useState('');
  const [handoutBody, setHandoutBody] = useState('');
  const [handoutTarget, setHandoutTarget] = useState<string>('ALL');

  // Patron Bulletin
  const [bulTitle, setBulTitle] = useState('');
  const [bulPatron, setBulPatron] = useState('');
  const [bulReward, setBulReward] = useState('Cr 30,000');
  const [bulSummary, setBulSummary] = useState('');

  // Spotlight resolution replies
  const [spotlightReplies, setSpotlightReplies] = useState<Record<string, string>>({});

  // Discord Webhook
  const [webhookUrl, setWebhookUrl] = useState(snapshot.refereeOnly?.discordWebhookUrl ?? '');
  const [discordTitle, setDiscordTitle] = useState('NEW TRANSMISSION ON LUCKY BREAK');
  const [discordMsg, setDiscordMsg] = useState(
    'A fresh Patron contract and Jump-Space update await on your terminal. Sign in to vote before Thursday!'
  );
  const [toast, setToast] = useState<string | null>(null);

  const effectiveTargetUid =
    players.find((p) => p.uid === targetUid)?.uid ?? players[0]?.uid ?? '';
  const effectiveTargetName =
    players.find((p) => p.uid === effectiveTargetUid)?.displayName ?? 'Crewmate';

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const applyPresetVirus = async (key: MindVirusPreset['key']) => {
    if (!effectiveTargetUid) return;
    const preset = buildMindVirusPreset(key, effectiveTargetName);
    await onInjectDirective(effectiveTargetUid, {
      id: makeId('dir'),
      title: preset.title,
      body: preset.body,
      isMindVirus: preset.isMindVirus,
      createdAt: Date.now(),
    });
    notify(`Injected [${preset.label}] silently into ${effectiveTargetName}'s private terminal.`);
  };

  const injectCustomVirus = async (isMindVirus: boolean) => {
    if (!effectiveTargetUid || !virusBody.trim()) return;
    await onInjectDirective(effectiveTargetUid, {
      id: makeId('dir'),
      title: isMindVirus ? virusTitle.trim() || 'BIO-NEURAL ANOMALY' : 'A.R.I.A. PRIVATE SUB-ROUTINE',
      body: virusBody.trim(),
      isMindVirus,
      createdAt: Date.now(),
    });
    setVirusBody('');
    notify(`Covert directive injected into ${effectiveTargetName}'s private/$uid path.`);
  };

  const activeDirectivesList = useMemo(() => {
    const rows: Array<{ uid: string; playerName: string; directive: PsychDirective }> = [];
    for (const [uid, priv] of Object.entries(snapshot.allPrivates ?? {})) {
      const name = snapshot.members[uid]?.displayName ?? uid;
      for (const dir of Object.values(priv.directives ?? {})) {
        rows.push({ uid, playerName: name, directive: dir });
      }
    }
    return rows;
  }, [snapshot.allPrivates, snapshot.members]);

  const pendingSpotlights = useMemo(() => {
    return Object.entries(snapshot.allPrivates ?? {})
      .filter(([, priv]) => Boolean(priv.spotlight))
      .map(([uid, priv]) => ({
        uid,
        playerName: snapshot.members[uid]?.displayName ?? uid,
        spotlight: priv.spotlight!,
      }));
  }, [snapshot.allPrivates, snapshot.members]);

  const unrevealedHandouts = Object.values(snapshot.refereeOnly?.unrevealedHandouts ?? {});
  const currentTier = snapshot.refereeOnly?.ariaTier ?? 1;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Referee Command Deck">
      <div className="modal-panel stack-md" style={{ maxWidth: 720 }}>
        <div className="row-between">
          <h2 className="section-title amber">
            <Shield size={16} /> REFEREE COMMAND DECK // {snapshot.meta.code}
          </h2>
          <button type="button" className="btn btn-sm" onClick={onClose} id="close-referee-drawer-btn">
            <X size={15} /> CLOSE
          </button>
        </div>

        {toast && (
          <div className="status-ticker" style={{ borderColor: 'var(--accent-phosphor)' }}>
            <span>{toast}</span>
          </div>
        )}

        {/* 1. COVERT MIND-VIRUS & WHISPER INJECTOR */}
        <section className="card card-alert stack-sm">
          <span className="section-title alert">
            <Skull size={15} /> COVERT MIND-VIRUS &amp; EYES-ONLY WHISPER INJECTOR
          </span>
          <p className="helper-text" style={{ fontSize: '0.8rem' }}>
            Writes strictly to `private/$uid/directives` — other players cannot read it even in Chrome DevTools.
          </p>

          {players.length === 0 ? (
            <p className="helper-text">No players have joined yet. (Open a second tab as Player 1 to test live!)</p>
          ) : (
            <>
              <div className="row-wrap">
                <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  TARGET PLAYER:
                </span>
                {players.map((p) => (
                  <button
                    key={p.uid}
                    type="button"
                    className={`tab-chip ${effectiveTargetUid === p.uid ? 'active' : ''}`}
                    onClick={() => setTargetUid(p.uid)}
                    id={`ref-target-${p.uid}`}
                  >
                    {p.displayName}
                  </button>
                ))}
              </div>

              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn-alert btn-sm"
                  onClick={() => void applyPresetVirus('MIND_VIRUS')}
                  id="inject-mind-virus-preset"
                >
                  MIND VIRUS
                </button>
                <button
                  type="button"
                  className="btn btn-alert btn-sm"
                  onClick={() => void applyPresetVirus('HALLUCINATION')}
                >
                  HALLUCINATION
                </button>
                <button
                  type="button"
                  className="btn btn-amber btn-sm"
                  onClick={() => void applyPresetVirus('SLEEPER_CIPHER')}
                >
                  SLEEPER CIPHER
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => void applyPresetVirus('ARIA_WHISPER')}
                >
                  A.R.I.A. WHISPER
                </button>
              </div>

              <input
                className="input mono"
                value={virusTitle}
                onChange={(e) => setVirusTitle(e.target.value)}
                placeholder="Symptom / Header"
              />
              <textarea
                className="textarea"
                value={virusBody}
                onChange={(e) => setVirusBody(e.target.value)}
                placeholder={`Custom eyes-only compulsion or whisper for ${effectiveTargetName}...`}
              />
              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn-alert btn-sm"
                  disabled={!virusBody.trim()}
                  onClick={() => void injectCustomVirus(true)}
                >
                  INJECT CUSTOM MIND VIRUS
                </button>
                <button
                  type="button"
                  className="btn btn-amber btn-sm"
                  disabled={!virusBody.trim()}
                  onClick={() => void injectCustomVirus(false)}
                >
                  SEND CUSTOM A.R.I.A. WHISPER
                </button>
              </div>
            </>
          )}

          {activeDirectivesList.length > 0 && (
            <div className="stack-sm" style={{ marginTop: 6 }}>
              <span className="mono" style={{ fontSize: '0.73rem', color: 'var(--accent-alert)' }}>
                ACTIVE COVERT INFECTIONS ({activeDirectivesList.length}):
              </span>
              {activeDirectivesList.map(({ uid, playerName, directive }) => (
                <div key={directive.id} className="feed-item row-between" style={{ padding: 8, borderLeftColor: 'var(--accent-alert)' }}>
                  <div>
                    <AlertTriangle size={12} color="var(--accent-alert)" />{' '}
                    <strong>{playerName}:</strong> {directive.title}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={async () => {
                      await onClearDirective(uid, directive.id);
                      notify(`Cleared directive from ${playerName}.`);
                    }}
                  >
                    CURE / CLEAR
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. A.R.I.A. TIER & CANON FACT SHEET */}
        <section className="card stack-sm">
          <div className="row-between">
            <span className="section-title">
              <Bot size={15} /> A.R.I.A. MEMORY TIER &amp; CANON FACT SHEET
            </span>
            <div className="row-wrap" style={{ gap: 5 }}>
              {[1, 2, 3, 4].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tab-chip ${currentTier === t ? 'active' : ''}`}
                  onClick={async () => {
                    await onUpdateRefereeOnly({ ariaTier: t });
                    notify(`A.R.I.A. Memory Tier set to T${t}.`);
                  }}
                >
                  T{t}
                </button>
              ))}
            </div>
          </div>
          <p className="helper-text" style={{ fontSize: '0.8rem' }}>
            Server-side `api/aria.php` strictly gates Tier 2–4 lore and locks A.R.I.A. to these Canon Facts (1 per line):
          </p>
          <textarea
            className="textarea"
            value={canonDraft}
            onChange={(e) => setCanonDraft(e.target.value)}
            rows={4}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={async () => {
              const facts = canonDraft
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
              await onUpdateRefereeOnly({ canonFacts: facts });
              notify('Saved A.R.I.A. Canon Fact Sheet.');
            }}
          >
            SAVE CANON FACT SHEET
          </button>
        </section>

        {/* 3. CAMPAIGN CLOCK & STATUS BANNER */}
        <section className="card stack-sm">
          <span className="section-title amber">
            <Calendar size={14} /> IMPERIAL DATE &amp; CAMPAIGN BANNER
          </span>
          <div className="grid-2">
            <div className="field">
              <label>Imperial Date</label>
              <input className="input mono" value={imperialDate} onChange={(e) => setImperialDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Mode</label>
              <select className="select" value={mode} onChange={(e) => setMode(e.target.value as CampaignMode)}>
                <option value="SESSION_0">SESSION_0</option>
                <option value="LIVE_SESSION">LIVE_SESSION</option>
                <option value="IN_JUMP">IN_JUMP (168h)</option>
                <option value="DOCKED">DOCKED</option>
              </select>
            </div>
          </div>
          <input className="input" value={statusBanner} onChange={(e) => setStatusBanner(e.target.value)} placeholder="Status Banner" />
          <input className="input" value={nextSession} onChange={(e) => setNextSession(e.target.value)} placeholder="Next Session label" />
          <button
            type="button"
            className="btn btn-amber btn-sm"
            onClick={async () => {
              await onUpdateMeta({ imperialDate, mode, statusBanner, nextSessionLabel: nextSession });
              notify('Updated Imperial Date & Status Ticker for all crew.');
            }}
          >
            BROADCAST STATUS UPDATE
          </button>
        </section>

        {/* 4. HANDOUT & CLUE PUSHER */}
        <section className="card stack-sm">
          <span className="section-title">
            <FilePlus2 size={14} /> HANDOUT &amp; CLUE PUSHER
          </span>

          {unrevealedHandouts.length > 0 && (
            <div className="stack-sm">
              <span className="mono" style={{ fontSize: '0.73rem', color: 'var(--accent-amber)' }}>
                SEALED CAMPAIGN HANDOUTS READY TO REVEAL:
              </span>
              {unrevealedHandouts.map((h) => (
                <div key={h.id} className="feed-item row-between" style={{ padding: 8 }}>
                  <strong>{h.title}</strong>
                  <div className="row-wrap" style={{ gap: 5 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        await onPushHandout(h, null);
                        notify(`Revealed "${h.title}" to ALL players!`);
                      }}
                    >
                      REVEAL ALL
                    </button>
                    {effectiveTargetUid && (
                      <button
                        type="button"
                        className="btn btn-amber btn-sm"
                        onClick={async () => {
                          await onPushHandout(h, effectiveTargetUid);
                          notify(`Sent "${h.title}" EYES-ONLY to ${effectiveTargetName}.`);
                        }}
                      >
                        EYES ONLY → {effectiveTargetName}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <input
            className="input"
            value={handoutTitle}
            onChange={(e) => setHandoutTitle(e.target.value)}
            placeholder="Custom Handout Title (e.g. Encrypted Manifest 04)"
          />
          <textarea
            className="textarea"
            value={handoutBody}
            onChange={(e) => setHandoutBody(e.target.value)}
            placeholder="Clue text, docking dispatch, or NPC intel..."
          />
          <div className="row-wrap">
            <select className="select" style={{ width: 200 }} value={handoutTarget} onChange={(e) => setHandoutTarget(e.target.value)}>
              <option value="ALL">Push to ALL Players</option>
              {players.map((p) => (
                <option key={p.uid} value={p.uid}>
                  Eyes Only → {p.displayName}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!handoutTitle.trim() || !handoutBody.trim()}
              onClick={async () => {
                await onPushHandout(
                  {
                    id: makeId('ho'),
                    title: handoutTitle.trim(),
                    category: 'CLUE',
                    subtitle: handoutTarget === 'ALL' ? 'Referee Broadcast' : 'Encrypted Private Clue',
                    body: handoutBody.trim(),
                    revealedAt: Date.now(),
                  },
                  handoutTarget === 'ALL' ? null : handoutTarget
                );
                setHandoutTitle('');
                setHandoutBody('');
                notify('Handout transmitted!');
              }}
            >
              <Send size={13} /> PUSH HANDOUT
            </button>
          </div>
        </section>

        {/* 5. REFEREE SPOTLIGHT INBOX */}
        <section className="card stack-sm">
          <span className="section-title amber">
            <Inbox size={14} /> ASYNC SPOTLIGHT INBOX ({pendingSpotlights.length})
          </span>
          {pendingSpotlights.length === 0 ? (
            <p className="helper-text" style={{ fontSize: '0.82rem' }}>
              No weekly Spotlight actions submitted yet.
            </p>
          ) : (
            pendingSpotlights.map(({ uid, playerName, spotlight }) => (
              <div key={uid} className="feed-item stack-sm" style={{ padding: 10 }}>
                <div className="row-between">
                  <strong>
                    {spotlight.characterName} ({playerName})
                  </strong>
                  <span className="badge badge-amber">{spotlight.status}</span>
                </div>
                <p className="feed-body" style={{ fontSize: '0.88rem' }}>
                  {spotlight.prompt}
                </p>
                <div className="row-wrap" style={{ flexWrap: 'nowrap' }}>
                  <input
                    className="input"
                    value={spotlightReplies[uid] ?? spotlight.refereeReply ?? ''}
                    onChange={(e) => setSpotlightReplies({ ...spotlightReplies, [uid]: e.target.value })}
                    placeholder="Write private eyes-only outcome..."
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      const reply = (spotlightReplies[uid] ?? '').trim();
                      if (!reply) return;
                      await onResolveSpotlight(uid, reply);
                      notify(`Resolved ${playerName}'s Spotlight privately.`);
                    }}
                  >
                    RESOLVE
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* 6. POST PATRON BULLETIN + DISCORD WEBHOOK */}
        <section className="card stack-sm">
          <span className="section-title">
            <Bell size={14} /> POST PATRON CONTRACT &amp; DISCORD WEBHOOK PING
          </span>
          <div className="grid-2">
            <input className="input" value={bulTitle} onChange={(e) => setBulTitle(e.target.value)} placeholder="Contract Title" />
            <input className="input" value={bulPatron} onChange={(e) => setBulPatron(e.target.value)} placeholder="Patron Name" />
          </div>
          <div className="grid-2">
            <input className="input" value={bulReward} onChange={(e) => setBulReward(e.target.value)} placeholder="Reward (e.g. Cr 40,000)" />
            <input className="input" value={bulSummary} onChange={(e) => setBulSummary(e.target.value)} placeholder="Brief contract hook..." />
          </div>
          <button
            type="button"
            className="btn btn-sm"
            disabled={!bulTitle.trim() || !bulSummary.trim()}
            onClick={async () => {
              await onPostBulletin({
                id: makeId('bul'),
                title: bulTitle.trim().toUpperCase(),
                patron: bulPatron.trim() || 'Anonymous Broker',
                reward: bulReward.trim() || 'Negotiable',
                summary: bulSummary.trim(),
                status: 'OPEN',
                votes: {},
                createdAt: Date.now(),
              });
              setBulTitle('');
              setBulSummary('');
              notify('Posted new Patron contract to Starport Bulletin!');
            }}
          >
            POST TO STARPORT BULLETIN
          </button>

          <div className="divider" />
          <input
            className="input mono"
            type="password"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="Discord Webhook URL (https://discord.com/api/webhooks/...)"
          />
          <input className="input" value={discordTitle} onChange={(e) => setDiscordTitle(e.target.value)} placeholder="Discord Dispatch Title" />
          <input className="input" value={discordMsg} onChange={(e) => setDiscordMsg(e.target.value)} placeholder="Spoiler-free teaser..." />
          <div className="row-wrap">
            <button
              type="button"
              className="btn btn-sm"
              onClick={async () => {
                await onUpdateRefereeOnly({ discordWebhookUrl: webhookUrl.trim() });
                notify('Saved Discord Webhook URL inside refereeOnly.');
              }}
            >
              SAVE WEBHOOK
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={async () => {
                const res = await dispatchDiscordPing({
                  title: discordTitle,
                  message: discordMsg,
                  imperialDate: snapshot.meta.imperialDate,
                  campaignUrl: `${window.location.origin}${window.location.pathname}#/?c=${snapshot.meta.code}`,
                  webhookUrl: webhookUrl.trim(),
                  isDemoMode,
                });
                notify(res.detail);
              }}
            >
              <Send size={13} /> PING DISCORD CHANNEL
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
