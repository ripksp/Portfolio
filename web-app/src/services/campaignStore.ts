import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { get, onValue, push, ref, remove, set, update } from 'firebase/database';
import { BUILTIN_HANDOUTS, DEFAULT_BULLETINS, DEFAULT_CANON_FACTS } from '../data/campaignPresets';
import type {
  BulletinItem,
  CampaignMember,
  CampaignMeta,
  CampaignSnapshot,
  DmMessage,
  DmThread,
  DowntimeEntry,
  FeedMessage,
  HandoutItem,
  PrivatePlayerSlice,
  PsychDirective,
  RefereeOnlyState,
  SpotlightSubmission,
  TravellerCharacter,
  UserIdentity,
} from '../types/campaign';
import { getFirebaseServices } from './firebaseConfig';

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeCampaignCode(raw: string): string {
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12);
  return clean || 'AEGS';
}

export function makeDmThreadId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('__');
}

export function createBlankCharacter(ownerUid: string, ownerName: string, customName?: string): TravellerCharacter {
  return {
    id: makeId('char'),
    ownerUid,
    ownerName,
    name: customName?.trim() || `${ownerName}'s Traveller`,
    archetype: 'New Recruit • Session 0',
    age: 18,
    homeworld: 'Port Breakwater',
    avatarUrl: '/aegis/assets/tokens/token_starship_scout.png',
    station: 'UNASSIGNED',
    lifepathComplete: false,
    draftUsed: false,
    cashRollsUsed: 0,
    shipShares: 0,
    medicalDebt: 0,
    credits: 2000,
    armorName: 'Vacc Suit (Basic)',
    armorRating: 4,
    reactionPenalty: 0,
    upp: {
      STR: { max: 7, current: 7 },
      DEX: { max: 7, current: 7 },
      END: { max: 7, current: 7 },
      INT: { max: 7, current: 7 },
      EDU: { max: 7, current: 7 },
      SOC: { max: 7, current: 7 },
    },
    skills: {
      'Vacc Suit': 0,
    },
    weapons: [
      { id: 'w_starter', name: 'Autopistol', damage: '3D6-3', range: '10m', magazine: '15', skill: 'Gun Combat (Slug)' },
    ],
    gear: [
      { id: 'g_comm', name: 'Personal Commlink', notes: 'Linked to SS Aegis Dawn / Lucky Break', qty: 1 },
    ],
    terms: [],
    connections: [],
    contacts: [],
    bio: '',
    studyProgress: {},
    updatedAt: Date.now(),
  };
}

function buildInitialCampaignRaw(code: string, referee: UserIdentity): {
  meta: CampaignMeta;
  members: Record<string, CampaignMember>;
  public: {
    characters: Record<string, TravellerCharacter>;
    feed: Record<string, FeedMessage>;
    handouts: Record<string, HandoutItem>;
    bulletins: Record<string, BulletinItem>;
    downtimeLog: Record<string, DowntimeEntry>;
  };
  private: Record<string, PrivatePlayerSlice>;
  dmThreads: Record<string, DmThread>;
  refereeOnly: RefereeOnlyState;
} {
  const now = Date.now();
  const revealedHandouts: Record<string, HandoutItem> = {};
  const unrevealedHandouts: Record<string, HandoutItem> = {};
  for (const h of BUILTIN_HANDOUTS) {
    if (h.revealedAt > 0) {
      revealedHandouts[h.id] = { ...h, revealedAt: now };
    } else {
      unrevealedHandouts[h.id] = h;
    }
  }

  const bulletins: Record<string, BulletinItem> = {};
  for (const b of DEFAULT_BULLETINS) {
    bulletins[b.id] = { ...b, createdAt: now };
  }

  const welcomeId = makeId('msg');
  return {
    meta: {
      code,
      name: 'The Rimward Verge',
      shipName: 'SS Aegis Dawn // Lucky Break',
      refereeUid: referee.uid,
      refereeName: referee.displayName,
      imperialDate: '1105-042',
      mode: 'SESSION_0',
      statusBanner: 'DOCKED: PORT BREAKWATER (BAY 67) — SESSION 0 CHARACTER CREATION',
      nextSessionLabel: 'NEXT SESSION: THANKSGIVING NIGHT (DISCORD VOICE)',
      createdAt: now,
    },
    members: {
      [referee.uid]: {
        uid: referee.uid,
        displayName: referee.displayName,
        email: referee.email,
        role: 'REFEREE',
        joinedAt: now,
      },
    },
    public: {
      characters: {},
      feed: {
        [welcomeId]: {
          id: welcomeId,
          kind: 'ARIA',
          senderUid: 'ARIA',
          senderName: 'A.R.I.A.',
          title: 'TERMINAL HANDSHAKE COMPLETE',
          body: 'Welcome aboard SS Aegis Dawn (transponder alias: Lucky Break). Magnetic clamps are engaged at Bay 67, Customs Droid K-REN has impounded our Jump Transponder, and your service dossiers are blank. Begin Session 0 when ready.',
          timestamp: now,
          ariaTier: 1,
        },
      },
      handouts: revealedHandouts,
      bulletins,
      downtimeLog: {},
    },
    private: {
      [referee.uid]: { notes: '', directives: {}, handouts: {}, spotlight: null },
    },
    dmThreads: {},
    refereeOnly: {
      ariaTier: 1,
      canonFacts: [...DEFAULT_CANON_FACTS],
      gmNotes: 'Session 0 -> Cold Open: Push Bay 67 Citation after character creation and run an Undocking Task Chain.',
      discordWebhookUrl: '',
      unrevealedHandouts,
    },
  };
}

export interface CampaignBackend {
  subscribe(code: string, user: UserIdentity, onData: (snap: CampaignSnapshot | null) => void): () => void;
  createOrJoinCampaign(code: string, user: UserIdentity, asReferee: boolean): Promise<{ created: boolean }>;
  saveCharacter(code: string, char: TravellerCharacter): Promise<void>;
  deleteCharacter(code: string, charId: string): Promise<void>;
  bindMemberCharacter(code: string, uid: string, charId: string): Promise<void>;
  postFeedMessage(code: string, msg: FeedMessage): Promise<void>;
  sendDirectMessage(
    code: string,
    from: UserIdentity,
    toUid: string,
    toName: string,
    body: string,
    opts?: { asAriaWhisper?: boolean; infectedEcho?: boolean }
  ): Promise<void>;
  savePrivateNotes(code: string, uid: string, notes: string): Promise<void>;
  injectDirective(code: string, targetUid: string, directive: PsychDirective): Promise<void>;
  clearDirective(code: string, targetUid: string, directiveId: string): Promise<void>;
  pushHandout(code: string, handout: HandoutItem, targetUid?: string | null): Promise<void>;
  postBulletin(code: string, bulletin: BulletinItem): Promise<void>;
  toggleBulletinVote(code: string, bulletinId: string, uid: string, voted: boolean): Promise<void>;
  logDowntime(code: string, entry: DowntimeEntry): Promise<void>;
  submitSpotlight(code: string, submission: SpotlightSubmission): Promise<void>;
  resolveSpotlight(code: string, targetUid: string, reply: string): Promise<void>;
  updateMeta(code: string, patch: Partial<CampaignMeta>): Promise<void>;
  updateRefereeOnly(code: string, patch: Partial<RefereeOnlyState>): Promise<void>;
}

/**
 * Local Multi-Tab Backend (localStorage + BroadcastChannel)
 * Syncs multiple browser tabs in real time for instant offline testing & multi-user QA!
 */
const LOCAL_STORAGE_PREFIX = 'aegis_os_campaign_v1_';
const LOCAL_CHANNEL_NAME = 'aegis_os_sync_v1';

type RawLocalCampaign = ReturnType<typeof buildInitialCampaignRaw>;

function readLocalCampaign(code: string): RawLocalCampaign | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + code);
    return raw ? (JSON.parse(raw) as RawLocalCampaign) : null;
  } catch {
    return null;
  }
}

function writeLocalCampaign(code: string, data: RawLocalCampaign): void {
  localStorage.setItem(LOCAL_STORAGE_PREFIX + code, JSON.stringify(data));
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(LOCAL_CHANNEL_NAME);
      ch.postMessage({ code, ts: Date.now() });
      ch.close();
    }
  } catch {
    // Ignore in environments without BroadcastChannel
  }
}

function projectLocalSnapshot(raw: RawLocalCampaign, user: UserIdentity): CampaignSnapshot {
  const isRef = raw.meta.refereeUid === user.uid;
  const myPrivate: PrivatePlayerSlice = raw.private[user.uid] ?? {
    notes: '',
    directives: {},
    handouts: {},
    spotlight: null,
  };

  const dmThreads = Object.values(raw.dmThreads ?? {})
    .filter((t) => isRef || t.participants?.[user.uid] === true)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return {
    meta: raw.meta,
    members: raw.members ?? {},
    characters: raw.public.characters ?? {},
    feed: Object.values(raw.public.feed ?? {}).sort((a, b) => b.timestamp - a.timestamp),
    handouts: Object.values(raw.public.handouts ?? {}).sort((a, b) => b.revealedAt - a.revealedAt),
    bulletins: Object.values(raw.public.bulletins ?? {}).sort((a, b) => b.createdAt - a.createdAt),
    downtimeLog: Object.values(raw.public.downtimeLog ?? {}).sort((a, b) => b.timestamp - a.timestamp),
    myPrivate,
    allPrivates: isRef ? raw.private ?? {} : {},
    dmThreads,
    refereeOnly: isRef ? raw.refereeOnly : null,
  };
}

export const localMultiTabBackend: CampaignBackend = {
  subscribe(code, user, onData) {
    const emit = () => {
      const raw = readLocalCampaign(code);
      onData(raw ? projectLocalSnapshot(raw, user) : null);
    };
    emit();

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === LOCAL_STORAGE_PREFIX + code) emit();
    };
    window.addEventListener('storage', onStorage);

    let ch: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel(LOCAL_CHANNEL_NAME);
      ch.onmessage = (ev) => {
        if (ev.data?.code === code) emit();
      };
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      ch?.close();
    };
  },

  async createOrJoinCampaign(code, user, asReferee) {
    let raw = readLocalCampaign(code);
    let created = false;
    if (!raw) {
      raw = buildInitialCampaignRaw(code, user);
      created = true;
    }
    if (asReferee && !raw.meta.refereeUid) {
      raw.meta.refereeUid = user.uid;
      raw.meta.refereeName = user.displayName;
    }
    const isRef = raw.meta.refereeUid === user.uid;
    raw.members[user.uid] = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: isRef ? 'REFEREE' : 'PLAYER',
      characterId: raw.members[user.uid]?.characterId,
      joinedAt: raw.members[user.uid]?.joinedAt ?? Date.now(),
    };
    if (!raw.private[user.uid]) {
      raw.private[user.uid] = { notes: '', directives: {}, handouts: {}, spotlight: null };
    }
    writeLocalCampaign(code, raw);
    return { created };
  },

  async saveCharacter(code, char) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    raw.public.characters[char.id] = { ...char, updatedAt: Date.now() };
    writeLocalCampaign(code, raw);
  },

  async deleteCharacter(code, charId) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    delete raw.public.characters[charId];
    writeLocalCampaign(code, raw);
  },

  async bindMemberCharacter(code, uid, charId) {
    const raw = readLocalCampaign(code);
    if (!raw || !raw.members[uid]) return;
    raw.members[uid].characterId = charId;
    writeLocalCampaign(code, raw);
  },

  async postFeedMessage(code, msg) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    raw.public.feed[msg.id] = msg;
    writeLocalCampaign(code, raw);
  },

  async sendDirectMessage(code, from, toUid, toName, body, opts) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    const threadId = makeDmThreadId(from.uid, toUid);
    const existing = raw.dmThreads[threadId] ?? {
      id: threadId,
      participants: { [from.uid]: true, [toUid]: true },
      participantNames: { [from.uid]: from.displayName, [toUid]: toName },
      messages: {},
      updatedAt: Date.now(),
    };
    const msgId = makeId('dm');
    const dm: DmMessage = {
      id: msgId,
      fromUid: from.uid,
      senderName: opts?.asAriaWhisper ? 'A.R.I.A. (PRIVATE)' : from.displayName,
      body,
      timestamp: Date.now(),
      asAriaWhisper: opts?.asAriaWhisper,
      infectedEcho: opts?.infectedEcho,
    };
    existing.participants[from.uid] = true;
    existing.participants[toUid] = true;
    existing.participantNames[from.uid] = from.displayName;
    existing.participantNames[toUid] = toName;
    existing.messages[msgId] = dm;
    existing.updatedAt = dm.timestamp;
    raw.dmThreads[threadId] = existing;
    writeLocalCampaign(code, raw);
  },

  async savePrivateNotes(code, uid, notes) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    if (!raw.private[uid]) raw.private[uid] = { notes: '', directives: {}, handouts: {}, spotlight: null };
    raw.private[uid].notes = notes;
    writeLocalCampaign(code, raw);
  },

  async injectDirective(code, targetUid, directive) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    if (!raw.private[targetUid]) raw.private[targetUid] = { notes: '', directives: {}, handouts: {}, spotlight: null };
    raw.private[targetUid].directives[directive.id] = directive;
    writeLocalCampaign(code, raw);
  },

  async clearDirective(code, targetUid, directiveId) {
    const raw = readLocalCampaign(code);
    if (!raw || !raw.private[targetUid]) return;
    delete raw.private[targetUid].directives[directiveId];
    writeLocalCampaign(code, raw);
  },

  async pushHandout(code, handout, targetUid) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    const stamped: HandoutItem = { ...handout, revealedAt: Date.now(), eyesOnlyForUid: targetUid ?? undefined };
    if (targetUid) {
      if (!raw.private[targetUid]) raw.private[targetUid] = { notes: '', directives: {}, handouts: {}, spotlight: null };
      raw.private[targetUid].handouts[stamped.id] = stamped;
    } else {
      raw.public.handouts[stamped.id] = stamped;
      if (raw.refereeOnly.unrevealedHandouts[stamped.id]) {
        delete raw.refereeOnly.unrevealedHandouts[stamped.id];
      }
    }
    writeLocalCampaign(code, raw);
  },

  async postBulletin(code, bulletin) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    raw.public.bulletins[bulletin.id] = bulletin;
    writeLocalCampaign(code, raw);
  },

  async toggleBulletinVote(code, bulletinId, uid, voted) {
    const raw = readLocalCampaign(code);
    if (!raw || !raw.public.bulletins[bulletinId]) return;
    if (voted) raw.public.bulletins[bulletinId].votes[uid] = true;
    else delete raw.public.bulletins[bulletinId].votes[uid];
    writeLocalCampaign(code, raw);
  },

  async logDowntime(code, entry) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    raw.public.downtimeLog[entry.id] = entry;
    writeLocalCampaign(code, raw);
  },

  async submitSpotlight(code, submission) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    if (!raw.private[submission.uid]) {
      raw.private[submission.uid] = { notes: '', directives: {}, handouts: {}, spotlight: null };
    }
    raw.private[submission.uid].spotlight = submission;
    writeLocalCampaign(code, raw);
  },

  async resolveSpotlight(code, targetUid, reply) {
    const raw = readLocalCampaign(code);
    if (!raw || !raw.private[targetUid]?.spotlight) return;
    raw.private[targetUid].spotlight = {
      ...raw.private[targetUid].spotlight!,
      status: 'RESOLVED',
      refereeReply: reply,
      resolvedAt: Date.now(),
    };
    writeLocalCampaign(code, raw);
  },

  async updateMeta(code, patch) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    raw.meta = { ...raw.meta, ...patch };
    writeLocalCampaign(code, raw);
  },

  async updateRefereeOnly(code, patch) {
    const raw = readLocalCampaign(code);
    if (!raw) return;
    raw.refereeOnly = { ...raw.refereeOnly, ...patch };
    writeLocalCampaign(code, raw);
  },
};

/**
 * Live Firebase Realtime Database Backend
 * Strictly subscribes ONLY to permitted paths (`meta`, `members`, `public`, `private/$uid`, `dmThreads`, `refereeOnly`)
 * matching the hardened `database.rules.json` schema.
 */
export const firebaseCampaignBackend: CampaignBackend = {
  subscribe(code, user, onData) {
    const { db } = getFirebaseServices();
    const unsubs: Array<() => void> = [];

    let meta: CampaignMeta | null = null;
    let members: Record<string, CampaignMember> = {};
    let publicData: {
      characters?: Record<string, TravellerCharacter>;
      feed?: Record<string, FeedMessage>;
      handouts?: Record<string, HandoutItem>;
      bulletins?: Record<string, BulletinItem>;
      downtimeLog?: Record<string, DowntimeEntry>;
    } = {};
    let myPrivate: PrivatePlayerSlice = { notes: '', directives: {}, handouts: {}, spotlight: null };
    let allPrivates: Record<string, PrivatePlayerSlice> = {};
    let dmThreadsMap: Record<string, DmThread> = {};
    let refereeOnly: RefereeOnlyState | null = null;
    let attachedRefListeners = false;
    let attachedDmListenersForMembers = '';

    const emit = () => {
      if (!meta) {
        onData(null);
        return;
      }
      const isRef = meta.refereeUid === user.uid;
      const dmThreads = Object.values(dmThreadsMap)
        .filter((t) => isRef || t.participants?.[user.uid] === true)
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

      onData({
        meta,
        members,
        characters: publicData.characters ?? {},
        feed: Object.values(publicData.feed ?? {}).sort((a, b) => b.timestamp - a.timestamp),
        handouts: Object.values(publicData.handouts ?? {}).sort((a, b) => b.revealedAt - a.revealedAt),
        bulletins: Object.values(publicData.bulletins ?? {}).sort((a, b) => b.createdAt - a.createdAt),
        downtimeLog: Object.values(publicData.downtimeLog ?? {}).sort((a, b) => b.timestamp - a.timestamp),
        myPrivate,
        allPrivates: isRef ? allPrivates : {},
        dmThreads,
        refereeOnly: isRef ? refereeOnly : null,
      });
    };

    const syncPlayerDmListeners = () => {
      if (!meta || meta.refereeUid === user.uid) return;
      const peerUids = Object.keys(members)
        .filter((uid) => uid !== user.uid)
        .sort();
      const signature = peerUids.join(',');
      if (signature === attachedDmListenersForMembers) return;
      attachedDmListenersForMembers = signature;

      for (const peerUid of peerUids) {
        const tid = makeDmThreadId(user.uid, peerUid);
        const u = onValue(
          ref(db, `campaigns/${code}/dmThreads/${tid}`),
          (snap) => {
            if (snap.exists()) {
              dmThreadsMap = { ...dmThreadsMap, [tid]: snap.val() as DmThread };
            }
            emit();
          },
          () => {}
        );
        unsubs.push(u);
      }
    };

    unsubs.push(
      onValue(ref(db, `campaigns/${code}/meta`), (snap) => {
        meta = snap.exists() ? (snap.val() as CampaignMeta) : null;
        if (meta && meta.refereeUid === user.uid && !attachedRefListeners) {
          attachedRefListeners = true;
          unsubs.push(
            onValue(ref(db, `campaigns/${code}/private`), (pSnap) => {
              allPrivates = pSnap.exists() ? (pSnap.val() as Record<string, PrivatePlayerSlice>) : {};
              emit();
            })
          );
          unsubs.push(
            onValue(ref(db, `campaigns/${code}/dmThreads`), (dSnap) => {
              dmThreadsMap = dSnap.exists() ? (dSnap.val() as Record<string, DmThread>) : {};
              emit();
            })
          );
          unsubs.push(
            onValue(ref(db, `campaigns/${code}/refereeOnly`), (rSnap) => {
              refereeOnly = rSnap.exists() ? (rSnap.val() as RefereeOnlyState) : null;
              emit();
            })
          );
        }
        syncPlayerDmListeners();
        emit();
      })
    );

    unsubs.push(
      onValue(
        ref(db, `campaigns/${code}/members`),
        (snap) => {
          members = snap.exists() ? (snap.val() as Record<string, CampaignMember>) : {};
          syncPlayerDmListeners();
          emit();
        },
        () => {}
      )
    );

    unsubs.push(
      onValue(
        ref(db, `campaigns/${code}/public`),
        (snap) => {
          publicData = snap.exists() ? (snap.val() as typeof publicData) : {};
          emit();
        },
        () => {}
      )
    );

    unsubs.push(
      onValue(
        ref(db, `campaigns/${code}/private/${user.uid}`),
        (snap) => {
          const val = snap.exists() ? (snap.val() as Partial<PrivatePlayerSlice>) : {};
          myPrivate = {
            notes: val.notes ?? '',
            directives: val.directives ?? {},
            handouts: val.handouts ?? {},
            spotlight: val.spotlight ?? null,
          };
          emit();
        },
        () => {}
      )
    );

    return () => {
      for (const u of unsubs) u();
    };
  },

  async createOrJoinCampaign(code, user, asReferee) {
    const { db } = getFirebaseServices();
    const metaSnap = await get(ref(db, `campaigns/${code}/meta`));
    if (!metaSnap.exists()) {
      const initial = buildInitialCampaignRaw(code, user);
      await set(ref(db, `campaigns/${code}/meta`), initial.meta);
      await set(ref(db, `campaigns/${code}/members/${user.uid}`), initial.members[user.uid]);
      await set(ref(db, `campaigns/${code}/public`), initial.public);
      await set(ref(db, `campaigns/${code}/private/${user.uid}`), initial.private[user.uid]);
      await set(ref(db, `campaigns/${code}/refereeOnly`), initial.refereeOnly);
      return { created: true };
    }

    const existingMeta = metaSnap.val() as CampaignMeta;
    const isRef = existingMeta.refereeUid === user.uid || (asReferee && !existingMeta.refereeUid);
    const memberRef = ref(db, `campaigns/${code}/members/${user.uid}`);
    const existingMember = await get(memberRef);
    const existingVal = existingMember.exists() ? (existingMember.val() as CampaignMember) : null;
    await set(memberRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: isRef ? 'REFEREE' : 'PLAYER',
      characterId: existingVal?.characterId ?? null,
      joinedAt: existingVal?.joinedAt ?? Date.now(),
    });
    return { created: false };
  },

  async saveCharacter(code, char) {
    const { db } = getFirebaseServices();
    await set(ref(db, `campaigns/${code}/public/characters/${char.id}`), { ...char, updatedAt: Date.now() });
  },

  async deleteCharacter(code, charId) {
    const { db } = getFirebaseServices();
    await remove(ref(db, `campaigns/${code}/public/characters/${charId}`));
  },

  async bindMemberCharacter(code, uid, charId) {
    const { db } = getFirebaseServices();
    await update(ref(db, `campaigns/${code}/members/${uid}`), { characterId: charId });
  },

  async postFeedMessage(code, msg) {
    const { db } = getFirebaseServices();
    const key = msg.id || push(ref(db, `campaigns/${code}/public/feed`)).key || makeId('msg');
    await set(ref(db, `campaigns/${code}/public/feed/${key}`), { ...msg, id: key });
  },

  async sendDirectMessage(code, from, toUid, toName, body, opts) {
    const { db } = getFirebaseServices();
    const threadId = makeDmThreadId(from.uid, toUid);
    const threadRef = ref(db, `campaigns/${code}/dmThreads/${threadId}`);
    const snap = await get(threadRef);
    const now = Date.now();
    const msgId = makeId('dm');
    const dm: DmMessage = {
      id: msgId,
      fromUid: from.uid,
      senderName: opts?.asAriaWhisper ? 'A.R.I.A. (PRIVATE)' : from.displayName,
      body,
      timestamp: now,
      asAriaWhisper: opts?.asAriaWhisper ?? false,
      infectedEcho: opts?.infectedEcho ?? false,
    };

    if (!snap.exists()) {
      await set(threadRef, {
        id: threadId,
        participants: { [from.uid]: true, [toUid]: true },
        participantNames: { [from.uid]: from.displayName, [toUid]: toName },
        messages: { [msgId]: dm },
        updatedAt: now,
      });
    } else {
      await update(threadRef, {
        [`participants/${from.uid}`]: true,
        [`participants/${toUid}`]: true,
        [`participantNames/${from.uid}`]: from.displayName,
        [`participantNames/${toUid}`]: toName,
        [`messages/${msgId}`]: dm,
        updatedAt: now,
      });
    }
  },

  async savePrivateNotes(code, uid, notes) {
    const { db } = getFirebaseServices();
    await update(ref(db, `campaigns/${code}/private/${uid}`), { notes });
  },

  async injectDirective(code, targetUid, directive) {
    const { db } = getFirebaseServices();
    await set(ref(db, `campaigns/${code}/private/${targetUid}/directives/${directive.id}`), directive);
  },

  async clearDirective(code, targetUid, directiveId) {
    const { db } = getFirebaseServices();
    await remove(ref(db, `campaigns/${code}/private/${targetUid}/directives/${directiveId}`));
  },

  async pushHandout(code, handout, targetUid) {
    const { db } = getFirebaseServices();
    const stamped: HandoutItem = { ...handout, revealedAt: Date.now() };
    if (targetUid) {
      stamped.eyesOnlyForUid = targetUid;
      await set(ref(db, `campaigns/${code}/private/${targetUid}/handouts/${stamped.id}`), stamped);
    } else {
      await set(ref(db, `campaigns/${code}/public/handouts/${stamped.id}`), stamped);
      await remove(ref(db, `campaigns/${code}/refereeOnly/unrevealedHandouts/${stamped.id}`));
    }
  },

  async postBulletin(code, bulletin) {
    const { db } = getFirebaseServices();
    await set(ref(db, `campaigns/${code}/public/bulletins/${bulletin.id}`), bulletin);
  },

  async toggleBulletinVote(code, bulletinId, uid, voted) {
    const { db } = getFirebaseServices();
    const voteRef = ref(db, `campaigns/${code}/public/bulletins/${bulletinId}/votes/${uid}`);
    if (voted) await set(voteRef, true);
    else await remove(voteRef);
  },

  async logDowntime(code, entry) {
    const { db } = getFirebaseServices();
    await set(ref(db, `campaigns/${code}/public/downtimeLog/${entry.id}`), entry);
  },

  async submitSpotlight(code, submission) {
    const { db } = getFirebaseServices();
    await set(ref(db, `campaigns/${code}/private/${submission.uid}/spotlight`), submission);
  },

  async resolveSpotlight(code, targetUid, reply) {
    const { db } = getFirebaseServices();
    await update(ref(db, `campaigns/${code}/private/${targetUid}/spotlight`), {
      status: 'RESOLVED',
      refereeReply: reply,
      resolvedAt: Date.now(),
    });
  },

  async updateMeta(code, patch) {
    const { db } = getFirebaseServices();
    await update(ref(db, `campaigns/${code}/meta`), patch);
  },

  async updateRefereeOnly(code, patch) {
    const { db } = getFirebaseServices();
    await update(ref(db, `campaigns/${code}/refereeOnly`), patch);
  },
};

// Firebase Email/Password Auth Helpers
export async function firebaseSignUp(email: string, password: string, displayName: string): Promise<UserIdentity> {
  const { auth } = getFirebaseServices();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: displayName.trim() });
  return {
    uid: cred.user.uid,
    email: cred.user.email ?? email.trim(),
    displayName: displayName.trim(),
    isDemoMode: false,
  };
}

export async function firebaseSignIn(email: string, password: string): Promise<UserIdentity> {
  const { auth } = getFirebaseServices();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return {
    uid: cred.user.uid,
    email: cred.user.email ?? email.trim(),
    displayName: cred.user.displayName || email.split('@')[0],
    isDemoMode: false,
  };
}

export async function firebaseSignOut(): Promise<void> {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}

export function subscribeFirebaseAuth(cb: (user: UserIdentity | null) => void): () => void {
  const { auth } = getFirebaseServices();
  return onAuthStateChanged(auth, (fbUser) => {
    if (!fbUser) {
      cb(null);
      return;
    }
    cb({
      uid: fbUser.uid,
      email: fbUser.email ?? '',
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Traveller',
      isDemoMode: false,
    });
  });
}
