import type { BulletinItem, HandoutItem, TravellerCharacter } from '../types/campaign';

export const DEFAULT_CANON_FACTS: string[] = [
  'Vessel: SS Aegis Dawn (100-ton salvaged Scout/Courier operating under transponder alias Lucky Break).',
  'Current Berth: Asteroid Base 67 — Port Breakwater, locked under 50-ton magnetic docking clamps.',
  'Outstanding Docking Fine: Cr 4,892,110 accumulated over 19,568 cycles; Jump Transponder impounded by Customs Droid K-REN.',
  'Release requires Citation Form 88-B with official stamp, service fee at The Rusty Vent, and B.A.S.E.-SYS guidance sync.',
  'Subsector: The Rimward Verge — corporate patrols from the 404th Task Force are active near Zephyr.',
];

export const BUILTIN_HANDOUTS: HandoutItem[] = [
  {
    id: 'handout_bay67_citation',
    title: 'PORT BREAKWATER // DOCKING BERTH CITATION',
    category: 'CITATION',
    subtitle: 'Facility: Asteroid Base 67 (Sub-Grid 04) • Kiosk #14280',
    imageUrl: '/aegis/assets/tokens/token_kren_customs.png',
    revealedAt: 1700000000000,
    body: `REGISTERED VESSEL: TR-1105-082 (Scout / Trader Class)
ACCUMULATED PARKING VIOLATIONS: 19,568 Consecutive Cycles
CURRENT OUTSTANDING FINE: Cr 4,892,110

PENALTY ACTION:
• 50-Ton Magnetic Docking Clamps: [ENGAGED]
• Primary Jump Transponder: [IMPOUNDED BY CUSTOMS DROID K-REN]

RELEASE PROCEDURE:
1. Present Citation Form 88-B with Official Customs Stamp.
2. Settle uncalibrated station service fee at The Rusty Vent.
3. Synchronize core guidance nodes with B.A.S.E.-SYS mainframe.

WARNING: Attempting to fire sublight manoeuvre drives while magnetic clamps are active will cause immediate hull breach.`,
  },
  {
    id: 'handout_aria_dossier',
    title: 'SHIPBOARD AI DOSSIER // A.R.I.A.',
    category: 'NPC_DOSSIER',
    subtitle: 'Automated Reconnaissance & Integration Assistant • Core Rev 4.2',
    imageUrl: '/aegis/assets/tokens/token_aria_ai.png',
    revealedAt: 1700000000001,
    body: `STATUS: Online (Archival Checksum Degraded)
VESSEL BINDING: SS Aegis Dawn / Lucky Break

NOTES:
• Salvaged with the hull; maintains dry cynicism regarding crew life expectancy and hull paint.
• Accessible 24/7 via the [COMMS → A.R.I.A.] channel for tactical summaries, ship status, and Jump-Space downtime logs.`,
  },
  {
    id: 'handout_silvano_vane',
    title: 'CONTACT DOSSIER // SILVANO VANE',
    category: 'NPC_DOSSIER',
    subtitle: 'Broker & Information Peddler • The Rusty Vent (Port Breakwater)',
    imageUrl: '/aegis/assets/tokens/token_silvano_vane.png',
    revealedAt: 1700000000002,
    body: `KNOWN AFFILIATION: Independent Rimward Syndicate Broker
LOCATION: Booth 4, The Rusty Vent

HOOK:
Claims he can clear a Form 88-B customs stamp overnight—for a "modest off-ledger courier run" to an unmarked survey beacon two parsecs rimward.`,
  },
  {
    id: 'handout_chimera_alert',
    title: 'CONTAINMENT SPECIMEN // CHIMERA LOG',
    category: 'CLUE',
    subtitle: 'REFEREE UNREVEALED — SEALED BIO-TELEMETRY',
    imageUrl: '/aegis/assets/tokens/token_chimera_specimen.png',
    revealedAt: 0,
    body: `ENCRYPTED BIO-BEACON INTERCEPT:
Specimen exhibits adaptive neuro-synaptic mimicry in low-oxygen compartments. Standard vacc suit seals hold; compromised filters produce Stage-1 auditory interference and micro-tremors within 4 hours.`,
  },
];

export const DEFAULT_BULLETINS: BulletinItem[] = [
  {
    id: 'bul_rusty_vent_run',
    title: 'OFF-LEDGER COURIER: KESTREL DRIFT BEACON',
    patron: 'Silvano Vane (The Rusty Vent)',
    reward: 'Form 88-B Customs Stamp + Cr 35,000',
    summary:
      'Retrieve a cold-storage telemetry core from an abandoned survey barge in Kestrel Drift before 404th Task Force sweepers arrive. No questions asked.',
    status: 'OPEN',
    votes: {},
    createdAt: 1700000000100,
  },
  {
    id: 'bul_vespera_grain',
    title: 'BLOCKADE RELIEF: MEDICAL & GRAIN CHARTER',
    patron: 'Port Breakwater Miners Guild',
    reward: 'Cr 45,000 + Free Refined Fuel Top-Off',
    summary:
      'Haul 14 tons of hydroponic seed stock and trauma kits past customs picket lines to the striking belter habitats around Vespera-4.',
    status: 'OPEN',
    votes: {},
    createdAt: 1700000000200,
  },
];

export const PRESET_CREW_TEMPLATES: Array<Omit<TravellerCharacter, 'id' | 'ownerUid' | 'ownerName' | 'updatedAt'>> = [
  {
    name: 'Declan Vance',
    archetype: 'The Spear • Ex-Marine Gunnery Sgt',
    age: 34,
    homeworld: 'Zephyr Highport',
    avatarUrl: '/aegis/assets/tokens/token_declan_vance.png',
    station: 'COMMAND',
    lifepathComplete: true,
    draftUsed: false,
    cashRollsUsed: 1,
    shipShares: 1,
    medicalDebt: 0,
    credits: 12000,
    armorName: 'Cloth Armor',
    armorRating: 8,
    reactionPenalty: 0,
    upp: {
      STR: { max: 9, current: 9 },
      DEX: { max: 8, current: 8 },
      END: { max: 10, current: 10 },
      INT: { max: 7, current: 7 },
      EDU: { max: 6, current: 6 },
      SOC: { max: 5, current: 5 },
    },
    skills: {
      'Gun Combat (Slug)': 2,
      'Melee (Blade)': 1,
      'Heavy Weapons': 1,
      Athletics: 1,
      'Tactics (Military)': 1,
      Leadership: 1,
      'Vacc Suit': 0,
    },
    weapons: [
      { id: 'w_shotgun', name: 'Combat Shotgun', damage: '4D6', range: '20m', magazine: '10', traits: 'Bulky', skill: 'Gun Combat (Slug)' },
      { id: 'w_cutlass', name: 'Heavy Cutlass', damage: '2D6+2', range: 'Melee', skill: 'Melee (Blade)' },
      { id: 'w_frag', name: 'Frag Grenades (x2)', damage: '4D6', range: 'Thrown', traits: 'Blast 5m', skill: 'Athletics' },
    ],
    gear: [
      { id: 'g_comm', name: 'Encrypted Squad Comm', notes: 'Short-range tactical burst', qty: 1 },
      { id: 'g_med', name: 'Field Trauma Pack', notes: 'Basic stabilization', qty: 1 },
    ],
    terms: [],
    connections: [],
    contacts: [{ id: 'c_404', name: '404th Task Force Officer', kind: 'ENEMY', notes: 'Refused corrupt order to fire on belter miners.' }],
    bio: 'Former Imperial Marine Gunnery Sergeant. Dishonorably discharged after refusing a corrupt order from a 404th Task Force officer to fire on striking belter miners. Direct, protective of his squad, prefers kinetic weapons.',
    studyProgress: {},
  },
  {
    name: 'Kallie Reyes',
    archetype: 'The Spear • Recon & Precision Marksman',
    age: 30,
    homeworld: 'Kestrel Rim',
    avatarUrl: '/aegis/assets/tokens/token_kallie_reyes.png',
    station: 'SENSORS',
    lifepathComplete: true,
    draftUsed: false,
    cashRollsUsed: 1,
    shipShares: 1,
    medicalDebt: 0,
    credits: 14500,
    armorName: 'Reflec Weave Armor',
    armorRating: 10,
    reactionPenalty: 0,
    upp: {
      STR: { max: 7, current: 7 },
      DEX: { max: 11, current: 11 },
      END: { max: 8, current: 8 },
      INT: { max: 8, current: 8 },
      EDU: { max: 7, current: 7 },
      SOC: { max: 6, current: 6 },
    },
    skills: {
      'Gun Combat (Energy)': 2,
      Stealth: 2,
      Recon: 2,
      Survival: 1,
      'Drive (Tracked)': 1,
      Athletics: 1,
    },
    weapons: [
      { id: 'w_lcarb', name: 'Laser Carbine', damage: '4D6', range: '50m', magazine: '50', traits: 'Zero-G', skill: 'Gun Combat (Energy)' },
      { id: 'w_vdag', name: 'Ceramic Vibro-Dagger', damage: '2D6+3', range: 'Melee', ap: 4, traits: 'AP 4', skill: 'Melee (Blade)' },
    ],
    gear: [{ id: 'g_optic', name: 'Thermal Recon Binoculars', notes: 'Low-light & IR sweep', qty: 1 }],
    terms: [],
    connections: [],
    contacts: [{ id: 'c_pros', name: 'Fringe Prospecting Syndicate', kind: 'CONTACT', notes: 'Former survey employer.' }],
    bio: 'Frontier scout sniper and survivalist. Hired by fringe prospecting syndicates to map lethal planetary terrain. Quiet, highly observant, never misses.',
    studyProgress: {},
  },
  {
    name: 'Borg Turok',
    archetype: 'The Spear • Heavy Demolitions & Breacher',
    age: 34,
    homeworld: 'Rust-Hollow Belt',
    avatarUrl: '/aegis/assets/tokens/token_borg_turok.png',
    station: 'GUNNER',
    lifepathComplete: true,
    draftUsed: false,
    cashRollsUsed: 1,
    shipShares: 0,
    medicalDebt: 0,
    credits: 9000,
    armorName: 'Heavy Combat Carapace',
    armorRating: 11,
    reactionPenalty: 0,
    upp: {
      STR: { max: 12, current: 12 },
      DEX: { max: 6, current: 6 },
      END: { max: 11, current: 11 },
      INT: { max: 6, current: 6 },
      EDU: { max: 5, current: 5 },
      SOC: { max: 4, current: 4 },
    },
    skills: {
      'Heavy Weapons': 2,
      Explosives: 2,
      'Melee (Unarmed)': 2,
      Athletics: 2,
      Mechanic: 1,
    },
    weapons: [
      { id: 'w_slugger', name: 'Portable Auto-Cannon', damage: '5D6', range: '30m', magazine: '20', ap: 4, traits: 'AP 4', skill: 'Heavy Weapons' },
      { id: 'w_maul', name: 'Stun Maul', damage: '3D6', range: 'Melee', traits: 'Stun', skill: 'Melee (Unarmed)' },
    ],
    gear: [{ id: 'g_breach', name: 'Breaching Charges', notes: 'Shaped hull-cutter charges', qty: 4 }],
    terms: [],
    connections: [],
    contacts: [],
    bio: 'Towering belter enforcer from Rust-Hollow. Modified with heavy-duty muscle weaves. Speaks with a deep gravel voice and treats blast doors like tissue paper.',
    studyProgress: {},
  },
  {
    name: 'Jax Mercer',
    archetype: 'The Helm • Scout Courier Veteran',
    age: 34,
    homeworld: 'Port Breakwater',
    avatarUrl: '/aegis/assets/tokens/token_jax_mercer.png',
    station: 'ENGINEER',
    lifepathComplete: true,
    draftUsed: false,
    cashRollsUsed: 1,
    shipShares: 2,
    medicalDebt: 0,
    credits: 16000,
    armorName: 'Vacc Suit (12h Life Support)',
    armorRating: 4,
    reactionPenalty: 0,
    upp: {
      STR: { max: 7, current: 7 },
      DEX: { max: 10, current: 10 },
      END: { max: 8, current: 8 },
      INT: { max: 9, current: 9 },
      EDU: { max: 8, current: 8 },
      SOC: { max: 6, current: 6 },
    },
    skills: {
      'Pilot (Spacecraft)': 2,
      Astrogation: 2,
      'Gunner (Turrets)': 1,
      'Electronics (Sensors)': 1,
      'Vacc Suit': 1,
      Mechanic: 1,
    },
    weapons: [
      { id: 'w_snub', name: 'Snub Pistol', damage: '3D6-3', range: '10m', magazine: '6', traits: 'Zero-G (Tranq & HE)', skill: 'Gun Combat (Slug)' },
      { id: 'w_knife', name: 'Survival Knife', damage: '1D6+3', range: 'Melee', skill: 'Melee (Blade)' },
    ],
    gear: [{ id: 'g_kit', name: 'Field Diagnostics Toolkit', notes: 'M-Drive & J-Drive bypass leads', qty: 1 }],
    terms: [],
    connections: [],
    contacts: [{ id: 'c_iiss', name: 'IISS Waystation Quartermaster', kind: 'ALLY', notes: 'Knows hidden refueling depots.' }],
    bio: 'Former IISS Scout Courier pilot who spent years surveying the Rimward Rift. Knows every hidden refueling spot in the subsector and talks to ship engines like old friends.',
    studyProgress: {},
  },
  {
    name: 'Pippa Chen',
    archetype: 'The Helm • Blockade Runner Pilot',
    age: 30,
    homeworld: 'Zephyr Orbital',
    avatarUrl: '/aegis/assets/tokens/token_pippa_chen.png',
    station: 'PILOT',
    lifepathComplete: true,
    draftUsed: false,
    cashRollsUsed: 1,
    shipShares: 1,
    medicalDebt: 0,
    credits: 18500,
    armorName: 'Armored Flight Suit',
    armorRating: 4,
    reactionPenalty: 0,
    upp: {
      STR: { max: 6, current: 6 },
      DEX: { max: 11, current: 11 },
      END: { max: 7, current: 7 },
      INT: { max: 8, current: 8 },
      EDU: { max: 8, current: 8 },
      SOC: { max: 7, current: 7 },
    },
    skills: {
      'Pilot (Spacecraft)': 2,
      Broker: 1,
      Navigation: 1,
      Gambler: 1,
      Deception: 1,
      Streetwise: 1,
    },
    weapons: [
      { id: 'w_bodyp', name: 'Body Pistol', damage: '2D6', range: '10m', magazine: '6', traits: 'Concealed', skill: 'Gun Combat (Slug)' },
      { id: 'w_sbaton', name: 'Stun Baton', damage: '2D6', range: 'Melee', traits: 'Stun', skill: 'Melee (Bludgeon)' },
    ],
    gear: [{ id: 'g_trans', name: 'Spoofed Transponder Chip', notes: 'Lucky Break backup registry', qty: 1 }],
    terms: [],
    connections: [],
    contacts: [{ id: 'c_smug', name: 'Port Breakwater Dock Fixer', kind: 'CONTACT', notes: 'Tips off 404th patrol windows.' }],
    bio: 'Free trader pilot with lightning reflexes. She made her name evading 404th customs cruisers between Zephyr and Port Breakwater with holds full of contraband grain.',
    studyProgress: {},
  },
];
