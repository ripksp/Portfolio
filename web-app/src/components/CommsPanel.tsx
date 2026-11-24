import React, { useMemo, useState } from 'react';
import {
  Bot,
  Dices,
  Lock,
  MessageSquare,
  Radio,
  Send,
  Sparkles,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import { formatDM } from '../data/mgt2eRules';
import type {
  CampaignSnapshot,
  DiceMode,
  FeedMessage,
  UserIdentity,
} from '../types/campaign';

type CommsSubTab = 'ALL' | 'PARTY' | 'ARIA' | 'DM';

interface CommsPanelProps {
  snapshot: CampaignSnapshot;
  user: UserIdentity;
  isReferee: boolean;
  isInfected: boolean;
  onSendParty: (text: string) => Promise<void>;
  onAskAria: (text: string) => Promise<void>;
  onSendDm: (targetUid: string, targetName: string, text: string, asAriaWhisper?: boolean) => Promise<void>;
  onQuickRoll: (mode: DiceMode, modifier: number, difficulty: number, label: string) => Promise<void>;
  onSelectTaskChain: (dm: number, sourceLabel: string) => void;
  ariaBusy: boolean;
}

export const CommsPanel: React.FC<CommsPanelProps> = ({
  snapshot,
  user,
  isReferee,
  isInfected,
  onSendParty,
  onAskAria,
  onSendDm,
  onQuickRoll,
  onSelectTaskChain,
  ariaBusy,
}) => {
  const [subTab, setSubTab] = useState<CommsSubTab>('ALL');
  const [draft, setDraft] = useState('');
  const [quickMod, setQuickMod] = useState(0);
  const [dmTargetUid, setDmTargetUid] = useState<string>('');
  const [whisperAsAria, setWhisperAsAria] = useState(false);

  const memberList = useMemo(
    () => Object.values(snapshot.members).filter((m) => m.uid !== user.uid),
    [snapshot.members, user.uid]
  );

  const effectiveDmTarget =
    memberList.find((m) => m.uid === dmTargetUid) ?? memberList[0] ?? null;

  const filteredFeed = useMemo(() => {
    if (subTab === 'PARTY') return snapshot.feed.filter((f) => f.kind === 'PARTY' || f.kind === 'SYSTEM');
    if (subTab === 'ARIA') return snapshot.feed.filter((f) => f.kind === 'ARIA' || f.title?.includes('A.R.I.A.'));
    return snapshot.feed;
  }, [snapshot.feed, subTab]);

  const activeDmThread = useMemo(() => {
    if (!effectiveDmTarget) return null;
    return (
      snapshot.dmThreads.find(
        (t) => t.participants?.[user.uid] && t.participants?.[effectiveDmTarget.uid]
      ) ?? null
    );
  }, [snapshot.dmThreads, user.uid, effectiveDmTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    setDraft('');
    if (subTab === 'ARIA') {
      await onAskAria(clean);
    } else if (subTab === 'DM') {
      if (effectiveDmTarget) {
        await onSendDm(
          effectiveDmTarget.uid,
          effectiveDmTarget.displayName,
          clean,
          isReferee && whisperAsAria
        );
      }
    } else {
      await onSendParty(clean);
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderFeedCard = (msg: FeedMessage) => (
    <article key={msg.id} className={`feed-item kind-${msg.kind}`}>
      <div className="feed-meta">
        <span className="row-wrap" style={{ gap: 6 }}>
          <strong style={{ color: msg.kind === 'ARIA' ? 'var(--accent-cyan)' : 'var(--accent-phosphor)' }}>
            {msg.characterName ? `${msg.characterName} (${msg.senderName})` : msg.senderName}
          </strong>
          <span className="badge">{msg.kind}</span>
          {isReferee && msg.infectedEcho && (
            <span className="badge badge-alert">
              <AlertTriangle size={11} /> INFECTED BIO-ECHO
            </span>
          )}
        </span>
        <span>{formatTime(msg.timestamp)}</span>
      </div>

      {msg.title && (
        <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', marginBottom: 4 }}>
          {msg.title}
        </div>
      )}

      <p className="feed-body">{msg.body}</p>

      {msg.roll && (
        <div className="roll-summary">
          <div>
            <span className={`roll-total ${msg.roll.effect < 0 ? 'fail' : ''}`}>
              {msg.roll.total}
            </span>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              [{msg.roll.kept.join('+')}]
              {msg.roll.diceMode !== 'NORMAL' ? ` (${msg.roll.diceMode}: ${msg.roll.dice.join(',')})` : ''}
              {msg.roll.modifier !== 0 ? ` ${formatDM(msg.roll.modifier)}` : ''}
              {msg.roll.taskChainDm !== 0 ? ` Chain ${formatDM(msg.roll.taskChainDm)}` : ''} vs {msg.roll.difficulty}+
            </span>
          </div>
          <div className="row-wrap" style={{ gap: 6 }}>
            <span className={`badge ${msg.roll.effect >= 0 ? 'badge-green' : 'badge-alert'}`}>
              EFF {formatDM(msg.roll.effect)} • {msg.roll.outcome}
            </span>
            <button
              type="button"
              className="btn btn-sm"
              title="Apply this roll's MgT2e Task Chain DM to your next skill check"
              onClick={() =>
                onSelectTaskChain(
                  msg.roll!.nextChainDm,
                  `${msg.characterName || msg.senderName} (${formatDM(msg.roll!.nextChainDm)})`
                )
              }
            >
              <Link2 size={12} /> CHAIN {formatDM(msg.roll.nextChainDm)}
            </button>
          </div>
        </div>
      )}
    </article>
  );

  return (
    <div className="stack-md" style={{ height: '100%' }}>
      {/* Quick Dice Strip */}
      <div className="card" style={{ padding: 10 }}>
        <div className="row-between" style={{ gap: 6 }}>
          <span className="section-title" style={{ fontSize: '0.76rem' }}>
            <Dices size={14} /> QUICK 2D6
          </span>
          <div className="row-wrap" style={{ gap: 5 }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setQuickMod((m) => m - 1)}
              aria-label="Decrease modifier"
            >
              -1
            </button>
            <span className="badge mono">DM {formatDM(quickMod)}</span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setQuickMod((m) => m + 1)}
              aria-label="Increase modifier"
            >
              +1
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void onQuickRoll('NORMAL', quickMod, 8, 'Quick 2D6 Check')}
              id="quick-roll-2d6"
            >
              2D6
            </button>
            <button
              type="button"
              className="btn btn-amber btn-sm"
              onClick={() => void onQuickRoll('BOON', quickMod, 8, 'Boon Check')}
            >
              BOON
            </button>
            <button
              type="button"
              className="btn btn-alert btn-sm"
              onClick={() => void onQuickRoll('BANE', quickMod, 8, 'Bane Check')}
            >
              BANE
            </button>
          </div>
        </div>
      </div>

      {/* Sub-channel selector */}
      <div className="tab-strip">
        <button
          type="button"
          className={`tab-chip ${subTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setSubTab('ALL')}
          id="comms-tab-all"
        >
          <Radio size={13} /> ALL / ROLLS
        </button>
        <button
          type="button"
          className={`tab-chip ${subTab === 'PARTY' ? 'active' : ''}`}
          onClick={() => setSubTab('PARTY')}
          id="comms-tab-party"
        >
          <MessageSquare size={13} /> PARTY
        </button>
        <button
          type="button"
          className={`tab-chip ${subTab === 'ARIA' ? 'active' : ''}`}
          onClick={() => setSubTab('ARIA')}
          id="comms-tab-aria"
        >
          <Bot size={13} /> A.R.I.A.
        </button>
        <button
          type="button"
          className={`tab-chip ${subTab === 'DM' ? 'active' : ''}`}
          onClick={() => setSubTab('DM')}
          id="comms-tab-dm"
        >
          <Lock size={13} /> {isReferee ? 'DMs / WIRETAP' : 'PRIVATE DMs'}
        </button>
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="card stack-sm" style={{ padding: 11 }}>
        {subTab === 'DM' && (
          <div className="row-between">
            <div className="row-wrap">
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                RECIPIENT:
              </span>
              {memberList.length === 0 ? (
                <span className="helper-text">Waiting for teammates to join...</span>
              ) : (
                memberList.map((m) => (
                  <button
                    key={m.uid}
                    type="button"
                    className={`tab-chip ${effectiveDmTarget?.uid === m.uid ? 'active' : ''}`}
                    onClick={() => setDmTargetUid(m.uid)}
                  >
                    {m.displayName} {m.role === 'REFEREE' ? '(REF)' : ''}
                  </button>
                ))
              )}
            </div>
            {isReferee && (
              <label className="row-wrap" style={{ fontSize: '0.78rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={whisperAsAria}
                  onChange={(e) => setWhisperAsAria(e.target.checked)}
                />
                Disguise as A.R.I.A.
              </label>
            )}
          </div>
        )}

        <div className="row-wrap" style={{ flexWrap: 'nowrap' }}>
          <input
            id="comms-input"
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              subTab === 'ARIA'
                ? 'Ask A.R.I.A. about ship status, cargo, or Sector intel...'
                : subTab === 'DM'
                ? `Encrypted DM to ${effectiveDmTarget?.displayName ?? 'teammate'}...`
                : 'Transmit on open Lucky Break party channel...'
            }
            disabled={ariaBusy || (subTab === 'DM' && !effectiveDmTarget)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={ariaBusy || !draft.trim() || (subTab === 'DM' && !effectiveDmTarget)}
            id="comms-send-btn"
          >
            {subTab === 'ARIA' ? <Sparkles size={15} /> : <Send size={15} />}
            {ariaBusy ? '...' : subTab === 'ARIA' ? 'ASK' : 'SEND'}
          </button>
        </div>

        {subTab === 'ARIA' && (
          <p className="helper-text" style={{ fontSize: '0.78rem' }}>
            24/7 Server-Side Heuristic Link • Bound to Referee Canon Fact Sheet
            {isInfected ? ' • [BIOMETRIC LINK ACTIVE]' : ''}
          </p>
        )}
      </form>

      {/* Channel Feed */}
      {subTab === 'DM' ? (
        <div className="stack-sm">
          {isReferee && snapshot.dmThreads.length > 0 && (
            <div className="card card-amber stack-sm" style={{ padding: 10 }}>
              <div className="section-title amber" style={{ fontSize: '0.75rem' }}>
                <Lock size={13} /> REFEREE WIRETAP — ALL PRIVATE THREADS ({snapshot.dmThreads.length})
              </div>
              {snapshot.dmThreads.map((thread) => {
                const msgs = Object.values(thread.messages ?? {}).sort((a, b) => b.timestamp - a.timestamp);
                const labels = Object.values(thread.participantNames ?? {}).join(' ↔ ');
                return (
                  <div key={thread.id} className="feed-item" style={{ borderLeftColor: 'var(--accent-amber)' }}>
                    <div className="feed-meta">
                      <strong>{labels || thread.id}</strong>
                      <span>{msgs.length} msgs</span>
                    </div>
                    {msgs.slice(0, 4).map((m) => (
                      <div key={m.id} style={{ fontSize: '0.88rem', marginTop: 4 }}>
                        <span className="mono" style={{ color: 'var(--accent-amber)' }}>
                          {m.senderName}:
                        </span>{' '}
                        {m.body}{' '}
                        {m.infectedEcho && <span className="badge badge-alert">BIO-ECHO</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {!isReferee && (
            <div className="feed-list">
              {!activeDmThread || Object.keys(activeDmThread.messages ?? {}).length === 0 ? (
                <div className="card">
                  <p className="helper-text">
                    No encrypted messages with {effectiveDmTarget?.displayName ?? 'this crewmate'} yet. Private DMs are isolated in Firebase RTDB so other players cannot inspect them.
                  </p>
                </div>
              ) : (
                Object.values(activeDmThread.messages)
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((dm) => (
                    <article
                      key={dm.id}
                      className="feed-item"
                      style={{
                        borderLeftColor: dm.asAriaWhisper ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                      }}
                    >
                      <div className="feed-meta">
                        <strong>{dm.senderName}</strong>
                        <span>{formatTime(dm.timestamp)}</span>
                      </div>
                      <p className="feed-body">{dm.body}</p>
                    </article>
                  ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="feed-list">
          {filteredFeed.length === 0 ? (
            <div className="card">
              <p className="helper-text">No transmissions in this channel yet.</p>
            </div>
          ) : (
            filteredFeed.slice(0, 60).map(renderFeedCard)
          )}
        </div>
      )}
    </div>
  );
};
