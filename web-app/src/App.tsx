import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  LogOut,
  MessageSquare,
  Monitor,
  Shield,
  User,
  X,
} from 'lucide-react';
import { AuthLobbyScreen } from './components/AuthLobbyScreen';
import { CharacterSheetPanel } from './components/CharacterSheetPanel';
import { CommsPanel } from './components/CommsPanel';
import { IntelAndAsyncPanel } from './components/IntelAndAsyncPanel';
import { RefereeDrawer } from './components/RefereeDrawer';
import { Session0Copilot } from './components/Session0Copilot';
import { rollTraveller2D6 } from './data/mgt2eRules';
import { queryAriaServer } from './services/ariaClient';
import {
  createBlankCharacter,
  firebaseCampaignBackend,
  firebaseSignOut,
  localMultiTabBackend,
  makeId,
  normalizeCampaignCode,
  subscribeFirebaseAuth,
} from './services/campaignStore';
import type {
  CampaignSnapshot,
  DiceMode,
  DiceRollPayload,
  DowntimeEntry,
  HandoutItem,
  TravellerCharacter,
  UserIdentity,
} from './types/campaign';

type PrimaryTab = 'TRAVELLER' | 'COMMS' | 'INTEL';

function extractCampaignCodeFromUrl(): string {
  const hash = window.location.hash || '';
  const queryPart = hash.includes('?') ? hash.split('?')[1] : window.location.search.replace(/^\?/, '');
  const params = new URLSearchParams(queryPart);
  const raw = params.get('c') || params.get('pin') || '';
  return raw ? normalizeCampaignCode(raw) : 'AEGS';
}

export const App: React.FC = () => {
  const [initialCode] = useState<string>(() => extractCampaignCodeFromUrl());
  const [user, setUser] = useState<UserIdentity | null>(null);
  const [campaignCode, setCampaignCode] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<CampaignSnapshot | null>(null);

  const [activeTab, setActiveTab] = useState<PrimaryTab>('TRAVELLER');
  const [desktopLeftView, setDesktopLeftView] = useState<'TRAVELLER' | 'INTEL'>('TRAVELLER');
  const [showSession0, setShowSession0] = useState<boolean>(true);
  const [inspectedCharId, setInspectedCharId] = useState<string | null>(null);
  const [refereeDrawerOpen, setRefereeDrawerOpen] = useState<boolean>(false);
  const [openHandout, setOpenHandout] = useState<HandoutItem | null>(null);
  const [activeTaskChain, setActiveTaskChain] = useState<{ dm: number; label: string } | null>(null);
  const [ariaBusy, setAriaBusy] = useState(false);
  const [crtFx, setCrtFx] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isDesktopSplit, setIsDesktopSplit] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 720px)').matches
      : true
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(min-width: 720px)');
    const onChange = (ev: MediaQueryListEvent) => setIsDesktopSplit(ev.matches);
    setIsDesktopSplit(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Sync CRT FX class on body (off by default for high legibility)
  useEffect(() => {
    document.body.classList.toggle('crt-fx', crtFx);
  }, [crtFx]);

  // Listen for persistent Firebase Auth sessions
  useEffect(() => {
    const unsub = subscribeFirebaseAuth((fbUser) => {
      setUser((prev) => {
        if (prev?.isDemoMode) return prev;
        return fbUser;
      });
    });
    return unsub;
  }, []);

  const backend = user?.isDemoMode ? localMultiTabBackend : firebaseCampaignBackend;

  // Subscribe to active campaign RTDB / LocalMultiTab state
  useEffect(() => {
    if (!user || !campaignCode) return;
    const unsub = backend.subscribe(campaignCode, user, (nextSnap) => {
      setSnapshot(nextSnap);
    });
    return unsub;
  }, [backend, campaignCode, user]);

  const isReferee = Boolean(snapshot && user && snapshot.meta.refereeUid === user.uid);

  // Determine the player's own Traveller (auto-creates a blank Session 0 dossier on first entry)
  const myCharacter = useMemo<TravellerCharacter | null>(() => {
    if (!snapshot || !user) return null;
    const boundId = snapshot.members[user.uid]?.characterId;
    if (boundId && snapshot.characters[boundId]) return snapshot.characters[boundId];
    const owned = Object.values(snapshot.characters).find((c) => c.ownerUid === user.uid);
    return owned ?? null;
  }, [snapshot, user]);

  const activeCharacter = useMemo<TravellerCharacter | null>(() => {
    if (isReferee && inspectedCharId && snapshot?.characters[inspectedCharId]) {
      return snapshot.characters[inspectedCharId];
    }
    return myCharacter;
  }, [isReferee, inspectedCharId, snapshot, myCharacter]);

  // Auto-provision a Session 0 character for players on first join
  useEffect(() => {
    if (!snapshot || !user || !campaignCode) return;
    if (myCharacter) {
      if (myCharacter.lifepathComplete && showSession0 && myCharacter.terms.length > 0) {
        // Keep user preference once toggled; no forced jump
      }
      return;
    }
    const blank = createBlankCharacter(user.uid, user.displayName);
    void backend.saveCharacter(campaignCode, blank).then(() =>
      backend.bindMemberCharacter(campaignCode, user.uid, blank.id)
    );
  }, [backend, campaignCode, myCharacter, showSession0, snapshot, user]);

  const activeDirectives = useMemo(
    () => Object.values(snapshot?.myPrivate.directives ?? {}).sort((a, b) => b.createdAt - a.createdAt),
    [snapshot]
  );

  const isInfected = activeDirectives.some((d) => d.isMindVirus);

  const handleAuthenticated = async (
    nextUser: UserIdentity,
    code: string,
    asReferee: boolean
  ) => {
    const chosenBackend = nextUser.isDemoMode ? localMultiTabBackend : firebaseCampaignBackend;
    await chosenBackend.createOrJoinCampaign(code, nextUser, asReferee);
    setUser(nextUser);
    setCampaignCode(code);
    window.location.hash = `/?c=${code}`;
  };

  const handleSignOut = async () => {
    if (user && !user.isDemoMode) {
      await firebaseSignOut();
    }
    setUser(null);
    setCampaignCode(null);
    setSnapshot(null);
    setInspectedCharId(null);
    setRefereeDrawerOpen(false);
  };

  if (!user || !campaignCode || !snapshot) {
    return (
      <AuthLobbyScreen
        initialCampaignCode={initialCode}
        currentUser={user}
        onAuthenticated={handleAuthenticated}
        onSignOut={handleSignOut}
      />
    );
  }

  const copyInviteLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#/?c=${snapshot.meta.code}`;
      await navigator.clipboard.writeText(url);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const postFeed = async (
    kind: import('./types/campaign').FeedKind,
    title: string | undefined,
    body: string,
    roll?: DiceRollPayload
  ) => {
    await backend.postFeedMessage(campaignCode, {
      id: makeId('msg'),
      kind,
      senderUid: user.uid,
      senderName: user.displayName,
      characterName: myCharacter?.name,
      title,
      body,
      timestamp: Date.now(),
      roll,
      infectedEcho: isInfected,
    });
  };

  const handleAskAria = async (
    question: string,
    mode: 'CREW_CHAT' | 'SESSION_0_REACT' | 'DOWNTIME_LOG' = 'CREW_CHAT'
  ) => {
    setAriaBusy(true);
    try {
      if (mode === 'CREW_CHAT') {
        await postFeed('PARTY', 'A.R.I.A. QUERY', question);
      }
      const recentAria = snapshot.feed
        .filter((f) => f.kind === 'ARIA' || f.title === 'A.R.I.A. QUERY')
        .slice(0, 6)
        .reverse()
        .map((f) => ({
          role: (f.senderUid === 'ARIA' ? 'model' : 'user') as 'user' | 'model',
          text: f.body,
        }));

      const resp = await queryAriaServer({
        message: question,
        senderName: myCharacter?.name || user.displayName,
        mode,
        ariaTier: snapshot.refereeOnly?.ariaTier ?? 1,
        imperialDate: snapshot.meta.imperialDate,
        campaignStatus: snapshot.meta.statusBanner,
        canonFacts: snapshot.refereeOnly?.canonFacts ?? [],
        bioAnomalyFlagged: isInfected,
        history: recentAria,
        isDemoMode: user.isDemoMode,
      });

      await backend.postFeedMessage(campaignCode, {
        id: makeId('aria'),
        kind: 'ARIA',
        senderUid: 'ARIA',
        senderName: 'A.R.I.A.',
        title:
          mode === 'SESSION_0_REACT'
            ? 'A.R.I.A. // SESSION 0 COMMENTARY'
            : mode === 'DOWNTIME_LOG'
            ? 'A.R.I.A. // JUMP-SPACE LOG'
            : `A.R.I.A. // TIER ${resp.tier}`,
        body: resp.reply,
        timestamp: Date.now(),
        ariaTier: resp.tier,
      });
    } finally {
      setAriaBusy(false);
    }
  };

  const handleQuickRoll = async (mode: DiceMode, modifier: number, difficulty: number, label: string) => {
    const roll = rollTraveller2D6({
      diceMode: mode,
      modifier,
      taskChainDm: activeTaskChain?.dm ?? 0,
      difficulty,
      skillName: label,
    });
    await postFeed(
      'ROLL',
      label.toUpperCase(),
      `${myCharacter?.name || user.displayName} rolled ${label}.`,
      roll
    );
    if (activeTaskChain) setActiveTaskChain(null);
  };

  const handleClaimPackageSkill = async (packageId: string, skill: string) => {
    const existing = snapshot.meta.claimedPackageSkills ?? {};
    const nextClaimed = skill ? { ...existing, [skill]: myCharacter?.name || user.displayName } : existing;
    await backend.updateMeta(campaignCode, {
      selectedSkillPackage: packageId,
      claimedPackageSkills: nextClaimed,
    });
  };

  const handleRunAutoDowntime = async (entry: DowntimeEntry, updatedChar?: TravellerCharacter) => {
    if (updatedChar) {
      await backend.saveCharacter(campaignCode, updatedChar);
    }
    const resp = await queryAriaServer({
      message: entry.summary,
      senderName: entry.characterName,
      mode: 'DOWNTIME_LOG',
      ariaTier: snapshot.refereeOnly?.ariaTier ?? 1,
      imperialDate: snapshot.meta.imperialDate,
      campaignStatus: snapshot.meta.statusBanner,
      canonFacts: snapshot.refereeOnly?.canonFacts ?? [],
      bioAnomalyFlagged: isInfected,
      isDemoMode: user.isDemoMode,
    });
    await backend.logDowntime(campaignCode, { ...entry, ariaNote: resp.reply });
    await postFeed('DOWNTIME', `JUMP-SPACE // ${entry.activity}`, `${entry.summary}\nA.R.I.A.: ${resp.reply}`, entry.roll);
  };

  const travellerContent = activeCharacter ? (
    showSession0 && !inspectedCharId ? (
      <Session0Copilot
        character={activeCharacter}
        snapshot={snapshot}
        onUpdateCharacter={(next) => backend.saveCharacter(campaignCode, next)}
        onBroadcastLifepath={(title, body, roll) => postFeed('LIFEPATH', title, body, roll)}
        onAriaReact={(summary) => handleAskAria(summary, 'SESSION_0_REACT')}
        onClaimPackageSkill={handleClaimPackageSkill}
        onFinishToSheet={() => setShowSession0(false)}
        ariaBusy={ariaBusy}
      />
    ) : (
      <div className="stack-sm">
        {isReferee && inspectedCharId && (
          <div className="card card-amber row-between" style={{ padding: 9 }}>
            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--accent-amber)' }}>
              REFEREE INSPECTING: {activeCharacter.name}
            </span>
            <button type="button" className="btn btn-sm" onClick={() => setInspectedCharId(null)}>
              RETURN TO MY SHEET
            </button>
          </div>
        )}
        <CharacterSheetPanel
          character={activeCharacter}
          privateNotes={snapshot.myPrivate.notes}
          activeTaskChain={activeTaskChain}
          onClearTaskChain={() => setActiveTaskChain(null)}
          onUpdateCharacter={(next) => backend.saveCharacter(campaignCode, next)}
          onSavePrivateNotes={(notes) => backend.savePrivateNotes(campaignCode, user.uid, notes)}
          onPostRoll={(title, body, roll) => postFeed('ROLL', title, body, roll)}
          onOpenSession0={() => {
            setInspectedCharId(null);
            setShowSession0(true);
          }}
        />
      </div>
    )
  ) : (
    <div className="card">
      <p className="helper-text">Initializing your Traveller dossier...</p>
    </div>
  );

  const commsContent = (
    <CommsPanel
      snapshot={snapshot}
      user={user}
      isReferee={isReferee}
      isInfected={isInfected}
      onSendParty={(text) => postFeed('PARTY', undefined, text)}
      onAskAria={(text) => handleAskAria(text, 'CREW_CHAT')}
      onSendDm={(targetUid, targetName, text, asAriaWhisper) =>
        backend.sendDirectMessage(campaignCode, user, targetUid, targetName, text, {
          asAriaWhisper,
          infectedEcho: isInfected,
        })
      }
      onQuickRoll={handleQuickRoll}
      onSelectTaskChain={(dm, label) => setActiveTaskChain({ dm, label })}
      ariaBusy={ariaBusy}
    />
  );

  const intelContent = (
    <IntelAndAsyncPanel
      snapshot={snapshot}
      user={user}
      myCharacter={myCharacter}
      isReferee={isReferee}
      onOpenHandout={(h) => setOpenHandout(h)}
      onToggleVote={(bid, voted) => backend.toggleBulletinVote(campaignCode, bid, user.uid, voted)}
      onRunAutoDowntime={handleRunAutoDowntime}
      onSubmitSpotlight={(prompt) =>
        backend.submitSpotlight(campaignCode, {
          id: makeId('spot'),
          uid: user.uid,
          characterName: myCharacter?.name || user.displayName,
          prompt,
          status: 'PENDING',
          submittedAt: Date.now(),
        })
      }
      onInspectCharacter={(charId) => {
        setInspectedCharId(charId);
        setShowSession0(false);
        setDesktopLeftView('TRAVELLER');
        setActiveTab('TRAVELLER');
      }}
      onOpenRefereeDrawer={() => setRefereeDrawerOpen(true)}
    />
  );

  return (
    <div className="app-shell">
      {/* TOP TELEMETRY CHROME */}
      <header className="top-chrome">
        <div className="top-chrome-row">
          <div className="brand-lockup">
            <h1 className="brand-title">AEGIS DAWN // {snapshot.meta.code}</h1>
            <span className={`badge ${isReferee ? 'badge-amber' : 'badge-green'}`}>
              {isReferee ? 'REFEREE' : user.displayName}
            </span>
            {user.isDemoMode && <span className="badge badge-cyan">SANDBOX</span>}
          </div>

          <div className="row-wrap" style={{ gap: 6 }}>
            <button type="button" className="btn btn-sm" onClick={copyInviteLink}>
              {copiedInvite ? <Check size={13} /> : <Copy size={13} />}
              {copiedInvite ? 'LINK COPIED' : 'INVITE'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${crtFx ? 'btn-primary' : ''}`}
              onClick={() => setCrtFx((v) => !v)}
              title="Toggle subtle CRT vignette effect"
            >
              <Monitor size={13} /> CRT FX
            </button>
            {isReferee && (
              <button
                type="button"
                className="btn btn-amber btn-sm"
                onClick={() => setRefereeDrawerOpen(true)}
                id="top-referee-deck-btn"
              >
                <Shield size={13} /> GM DECK
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleSignOut()} aria-label="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="status-ticker">
          <span>
            <strong>[{snapshot.meta.imperialDate}]</strong> {snapshot.meta.statusBanner}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{snapshot.meta.nextSessionLabel}</span>
        </div>
      </header>

      {/* COVERT EYES-ONLY MIND-VIRUS / WHISPER BANNER (ONLY TARGET PLAYER SEES THIS!) */}
      {activeDirectives.map((dir) => (
        <aside
          key={dir.id}
          className={`mind-virus-banner ${dir.isMindVirus ? '' : 'whisper'}`}
          role="alert"
          data-testid="eyes-only-directive"
        >
          <div className="mind-virus-header">
            <span className="row-wrap" style={{ gap: 6 }}>
              <AlertTriangle size={14} />
              {dir.isMindVirus ? `BIO-NEURAL ANOMALY // EYES ONLY — ${dir.title}` : `PRIVATE TRANSMISSION // ${dir.title}`}
            </span>
            <span className="badge badge-alert">ONLY YOU CAN SEE THIS</span>
          </div>
          <p className="feed-body" style={{ fontSize: '0.92rem' }}>
            {dir.body}
          </p>
        </aside>
      ))}

      {/* WORKSPACE BODY */}
      <div className="workspace-body">
        {!isDesktopSplit ? (
          <div className="pane-scroll">
            {activeTab === 'TRAVELLER' && travellerContent}
            {activeTab === 'COMMS' && commsContent}
            {activeTab === 'INTEL' && intelContent}
          </div>
        ) : (
          <div className="desktop-split">
            <div className="desktop-main-pane">
              <div style={{ padding: '10px 14px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="tab-strip">
                  <button
                    type="button"
                    className={`tab-chip ${desktopLeftView === 'TRAVELLER' ? 'active' : ''}`}
                    onClick={() => setDesktopLeftView('TRAVELLER')}
                    id="desktop-tab-traveller"
                  >
                    <User size={14} /> TRAVELLER &amp; SESSION 0
                  </button>
                  <button
                    type="button"
                    className={`tab-chip ${desktopLeftView === 'INTEL' ? 'active' : ''}`}
                    onClick={() => setDesktopLeftView('INTEL')}
                    id="desktop-tab-intel"
                  >
                    <FileText size={14} /> INTEL, HANDOUTS &amp; ASYNC JUMP HUB
                  </button>
                </div>
              </div>
              <div className="pane-scroll">
                {desktopLeftView === 'TRAVELLER' ? travellerContent : intelContent}
              </div>
            </div>

            <div className="desktop-side-pane">
              <div className="pane-scroll">{commsContent}</div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAVIGATION (3 TABS ONLY) */}
      {!isDesktopSplit && (
        <nav className="bottom-nav" aria-label="Primary Navigation">
          <button
            type="button"
            className={`nav-btn ${activeTab === 'TRAVELLER' ? 'active' : ''}`}
            onClick={() => setActiveTab('TRAVELLER')}
            id="mobile-nav-traveller"
          >
            <User size={18} />
            TRAVELLER
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === 'COMMS' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMMS')}
            id="mobile-nav-comms"
          >
            <MessageSquare size={18} />
            COMMS
            {snapshot.feed.length > 0 && <span className="nav-badge">{Math.min(99, snapshot.feed.length)}</span>}
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === 'INTEL' ? 'active' : ''}`}
            onClick={() => setActiveTab('INTEL')}
            id="mobile-nav-intel"
          >
            <FileText size={18} />
            INTEL
          </button>
        </nav>
      )}

      {/* REFEREE COMMAND DECK DRAWER */}
      {isReferee && refereeDrawerOpen && (
        <RefereeDrawer
          snapshot={snapshot}
          isDemoMode={user.isDemoMode}
          onClose={() => setRefereeDrawerOpen(false)}
          onUpdateMeta={(patch) => backend.updateMeta(campaignCode, patch)}
          onUpdateRefereeOnly={(patch) => backend.updateRefereeOnly(campaignCode, patch)}
          onInjectDirective={(targetUid, dir) => backend.injectDirective(campaignCode, targetUid, dir)}
          onClearDirective={(targetUid, dirId) => backend.clearDirective(campaignCode, targetUid, dirId)}
          onPushHandout={(h, targetUid) => backend.pushHandout(campaignCode, h, targetUid)}
          onPostBulletin={(b) => backend.postBulletin(campaignCode, b)}
          onResolveSpotlight={(targetUid, reply) => backend.resolveSpotlight(campaignCode, targetUid, reply)}
        />
      )}

      {/* INCOMING TRANSMISSION HANDOUT MODAL */}
      {openHandout && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={openHandout.title}
          onClick={() => setOpenHandout(null)}
        >
          <div className="modal-panel stack-md" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <div className="row-wrap" style={{ gap: 10 }}>
                {openHandout.imageUrl && (
                  <img src={openHandout.imageUrl} alt={openHandout.title} className="token-avatar" />
                )}
                <div>
                  <span className={`badge ${openHandout.eyesOnlyForUid ? 'badge-alert' : 'badge-green'}`}>
                    {openHandout.eyesOnlyForUid ? 'EYES ONLY TRANSMISSION' : openHandout.category}
                  </span>
                  <h2 style={{ margin: '4px 0 0', fontSize: '1.05rem' }}>{openHandout.title}</h2>
                </div>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => setOpenHandout(null)}>
                <X size={15} /> CLOSE
              </button>
            </div>
            {openHandout.subtitle && <p className="helper-text">{openHandout.subtitle}</p>}
            <pre className="handout-pre">{openHandout.body}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
