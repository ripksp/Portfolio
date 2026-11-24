export type UppKey = 'STR' | 'DEX' | 'END' | 'INT' | 'EDU' | 'SOC';

export type ShipStation = 'UNASSIGNED' | 'PILOT' | 'COMMAND' | 'ENGINEER' | 'GUNNER' | 'SENSORS';

export type DiceMode = 'NORMAL' | 'BOON' | 'BANE';

export type CampaignMode = 'SESSION_0' | 'LIVE_SESSION' | 'IN_JUMP' | 'DOCKED';

export interface UppStat {
  max: number;
  current: number;
}

export type UppBlock = Record<UppKey, UppStat>;

export interface WeaponItem {
  id: string;
  name: string;
  damage: string; // e.g., "4D6", "2D6+2", "3D6-3"
  range: string;
  magazine?: string;
  ap?: number;
  traits?: string;
  skill?: string;
}

export interface GearItem {
  id: string;
  name: string;
  notes: string;
  qty: number;
}

export interface CareerTermRecord {
  id: string;
  termNumber: number;
  ageStart: number;
  careerId: string;
  careerName: string;
  assignment: string;
  rank: number;
  rankTitle: string;
  isOfficer?: boolean;
  survived: boolean;
  advanced: boolean;
  mishap?: string;
  event?: string;
  skillsGained: string[];
  notes?: string;
}

export interface ConnectionLink {
  id: string;
  partnerCharId: string;
  partnerName: string;
  termNumber: number;
  summary: string;
  skillChosen: string;
}

export interface ContactEntry {
  id: string;
  name: string;
  kind: 'ALLY' | 'CONTACT' | 'RIVAL' | 'ENEMY';
  notes: string;
}

export interface TravellerCharacter {
  id: string;
  ownerUid: string;
  ownerName: string;
  name: string;
  archetype: string;
  age: number;
  homeworld: string;
  avatarUrl?: string;
  station: ShipStation;
  lifepathComplete: boolean;
  draftUsed: boolean;
  cashRollsUsed: number;
  shipShares: number;
  medicalDebt: number;
  credits: number;
  armorName: string;
  armorRating: number;
  reactionPenalty: number;
  upp: UppBlock;
  skills: Record<string, number>;
  weapons: WeaponItem[];
  gear: GearItem[];
  terms: CareerTermRecord[];
  connections: ConnectionLink[];
  contacts: ContactEntry[];
  bio: string;
  studyProgress: Record<string, number>; // MgT2e study weeks per skill
  updatedAt: number;
}

export interface DiceRollPayload {
  dice: number[];
  kept: [number, number];
  diceMode: DiceMode;
  modifier: number;
  taskChainDm: number;
  difficulty: number;
  total: number;
  effect: number;
  outcome: string;
  nextChainDm: number;
  skillName?: string;
  statKey?: UppKey;
  damageTotal?: number;
  weaponName?: string;
}

export type FeedKind = 'ROLL' | 'PARTY' | 'ARIA' | 'LIFEPATH' | 'SYSTEM' | 'DOWNTIME';

export interface FeedMessage {
  id: string;
  kind: FeedKind;
  senderUid: string;
  senderName: string;
  characterName?: string;
  title?: string;
  body: string;
  timestamp: number;
  roll?: DiceRollPayload;
  infectedEcho?: boolean;
  ariaTier?: number;
}

export interface DmMessage {
  id: string;
  fromUid: string;
  senderName: string;
  body: string;
  timestamp: number;
  asAriaWhisper?: boolean;
  infectedEcho?: boolean;
}

export interface DmThread {
  id: string;
  participants: Record<string, boolean>;
  participantNames: Record<string, string>;
  messages: Record<string, DmMessage>;
  updatedAt: number;
}

export interface PsychDirective {
  id: string;
  title: string;
  body: string;
  isMindVirus: boolean;
  createdAt: number;
  acknowledged?: boolean;
}

export interface HandoutItem {
  id: string;
  title: string;
  category: 'CITATION' | 'DISPATCH' | 'NPC_DOSSIER' | 'CLUE';
  subtitle?: string;
  body: string;
  imageUrl?: string;
  revealedAt: number;
  eyesOnlyForUid?: string;
}

export interface BulletinItem {
  id: string;
  title: string;
  patron: string;
  reward: string;
  summary: string;
  status: 'OPEN' | 'ACTIVE' | 'ARCHIVED';
  votes: Record<string, boolean>; // uid -> voted
  createdAt: number;
}

export interface DowntimeEntry {
  id: string;
  uid: string;
  characterId: string;
  characterName: string;
  activity: 'STUDY' | 'REPAIR' | 'MEDBAY' | 'CAROUSE' | 'HACK' | 'BROKER';
  skillUsed: string;
  summary: string;
  roll?: DiceRollPayload;
  ariaNote?: string;
  timestamp: number;
}

export interface SpotlightSubmission {
  id: string;
  uid: string;
  characterName: string;
  prompt: string;
  status: 'PENDING' | 'RESOLVED';
  refereeReply?: string;
  submittedAt: number;
  resolvedAt?: number;
}

export interface PrivatePlayerSlice {
  notes: string;
  directives: Record<string, PsychDirective>;
  handouts: Record<string, HandoutItem>;
  spotlight?: SpotlightSubmission | null;
}

export interface CampaignMeta {
  code: string;
  name: string;
  shipName: string;
  refereeUid: string;
  refereeName: string;
  imperialDate: string;
  mode: CampaignMode;
  statusBanner: string;
  nextSessionLabel: string;
  selectedSkillPackage?: string;
  claimedPackageSkills?: Record<string, string>; // skill -> charName
  createdAt: number;
}

export interface CampaignMember {
  uid: string;
  displayName: string;
  email?: string;
  role: 'REFEREE' | 'PLAYER';
  characterId?: string;
  joinedAt: number;
}

export interface RefereeOnlyState {
  ariaTier: number; // 1..4
  canonFacts: string[];
  gmNotes: string;
  discordWebhookUrl: string;
  unrevealedHandouts: Record<string, HandoutItem>;
}

export interface CampaignSnapshot {
  meta: CampaignMeta;
  members: Record<string, CampaignMember>;
  characters: Record<string, TravellerCharacter>;
  feed: FeedMessage[];
  handouts: HandoutItem[];
  bulletins: BulletinItem[];
  downtimeLog: DowntimeEntry[];
  myPrivate: PrivatePlayerSlice;
  allPrivates: Record<string, PrivatePlayerSlice>; // populated ONLY for Referee
  dmThreads: DmThread[];
  refereeOnly: RefereeOnlyState | null; // populated ONLY for Referee
}

export interface UserIdentity {
  uid: string;
  email: string;
  displayName: string;
  isDemoMode: boolean;
}
