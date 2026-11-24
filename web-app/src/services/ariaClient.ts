export type AriaMode = 'CREW_CHAT' | 'SESSION_0_REACT' | 'DOWNTIME_LOG';

export interface AriaRequestParams {
  message: string;
  senderName: string;
  mode: AriaMode;
  ariaTier: number;
  imperialDate: string;
  campaignStatus: string;
  canonFacts: string[];
  bioAnomalyFlagged?: boolean;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  isDemoMode?: boolean;
}

export interface AriaResponse {
  reply: string;
  provider: string;
  tier: number;
}

export interface MindVirusPreset {
  key: 'MIND_VIRUS' | 'HALLUCINATION' | 'SLEEPER_CIPHER' | 'ARIA_WHISPER';
  label: string;
  title: string;
  body: string;
  isMindVirus: boolean;
}

export function buildMindVirusPreset(
  key: MindVirusPreset['key'],
  targetName: string
): MindVirusPreset {
  switch (key) {
    case 'MIND_VIRUS':
      return {
        key,
        label: 'MIND VIRUS',
        title: 'STAGE-1 CHIMERA NEURO-PARASITE',
        body: `[EYES ONLY — ${targetName.toUpperCase()}] A faint rhythmic hum sits behind your eyes. You feel an overwhelming urge to keep the auxiliary airlock override code to yourself—and you are quietly convinced one teammate is hiding corporate tracking hardware.`,
        isMindVirus: true,
      };
    case 'HALLUCINATION':
      return {
        key,
        label: 'HALLUCINATION',
        title: 'HYPOXIA / SENSOR PHANTOM',
        body: `[EYES ONLY — ${targetName.toUpperCase()}] Every reflection in the bulkhead glass lags half a second behind your movements. You could swear you just heard footsteps pacing inside the sealed J-Drive plenum.`,
        isMindVirus: true,
      };
    case 'SLEEPER_CIPHER':
      return {
        key,
        label: 'SLEEPER CIPHER',
        title: 'SUB-CORTEX DIRECTIVE 99-OMEGA',
        body: `[EYES ONLY — ${targetName.toUpperCase()}] Buried muscle-memory surfaces when you see corporate hex-codes: prioritize securing any sealed bio-canisters before the rest of the crew can jettison them.`,
        isMindVirus: true,
      };
    case 'ARIA_WHISPER':
      return {
        key,
        label: 'A.R.I.A. WHISPER',
        title: 'A.R.I.A. PRIVATE SUB-ROUTINE',
        body: `[PRIVATE LINK — ${targetName.toUpperCase()}] Don't announce this on open bridge comms. My internal scrubber sensors logged a spike in elevated adrenaline and optic-lag from another crew compartment three minutes ago. Watch your back.`,
        isMindVirus: false,
      };
  }
}

function buildLocalFallbackReply(params: AriaRequestParams): string {
  const bioAside = params.bioAnomalyFlagged
    ? ' (Side note: your vocal micro-tremor is running 14% hot—hydrate or check your suit scrubber.) '
    : ' ';

  if (params.mode === 'SESSION_0_REACT') {
    const low = params.message.toLowerCase();
    if (low.includes('mishap') || low.includes('injur') || low.includes('fail')) {
      return `Fascinating service record, ${params.senderName}. Nothing boosts my confidence in hull longevity quite like hiring organics with fresh medical bills.`;
    }
    if (low.includes('promot') || low.includes('commission') || low.includes('success')) {
      return `Impressive credentials, ${params.senderName}. Let's see if they survive our first customs inspection at Port Breakwater.`;
    }
    return `Logged to crew dossier, ${params.senderName}. Try not to accumulate any more felony warrants before we clear the magnetic clamps.`;
  }

  if (params.mode === 'DOWNTIME_LOG') {
    return `Jump-Space telemetry updated, ${params.senderName}.${bioAside}At least someone aboard Lucky Break is using these 168 hours productively instead of rewiring the coffee dispenser.`;
  }

  const lower = params.message.toLowerCase();
  if (params.ariaTier <= 1 && (lower.includes('origin') || lower.includes('bio') || lower.includes('weapon') || lower.includes('secret'))) {
    return `[ARCHIVE CORRUPTED / CHECKSUM MISMATCH] Nice try, ${params.senderName}. Those archival sectors were shredded in salvage—ask the Referee if you want folklore.`;
  }

  return `Copy, ${params.senderName}.${bioAside}We are currently logged at ${params.imperialDate} (${params.campaignStatus}). Hull integrity holds—keep your vacc seal checked and let me know if you need a status rundown.`;
}

export async function queryAriaServer(params: AriaRequestParams): Promise<AriaResponse> {
  if (params.isDemoMode) {
    return {
      reply: buildLocalFallbackReply(params),
      provider: 'local-heuristic',
      tier: params.ariaTier,
    };
  }

  try {
    const response = await fetch('/api/aria.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.message,
        senderName: params.senderName,
        mode: params.mode,
        ariaTier: params.ariaTier,
        imperialDate: params.imperialDate,
        campaignStatus: params.campaignStatus,
        canonFacts: params.canonFacts,
        bioAnomalyFlagged: Boolean(params.bioAnomalyFlagged),
        history: params.history ?? [],
      }),
    });

    if (!response.ok) {
      return {
        reply: buildLocalFallbackReply(params),
        provider: 'fallback-http',
        tier: params.ariaTier,
      };
    }

    const data = (await response.json()) as Partial<AriaResponse>;
    if (typeof data.reply === 'string' && data.reply.trim() !== '') {
      return {
        reply: data.reply.trim(),
        provider: data.provider ?? 'gemini',
        tier: data.tier ?? params.ariaTier,
      };
    }
  } catch {
    // Fall back cleanly if offline or local Vite dev server without PHP
  }

  return {
    reply: buildLocalFallbackReply(params),
    provider: 'fallback-offline',
    tier: params.ariaTier,
  };
}

export async function dispatchDiscordPing(params: {
  title: string;
  message: string;
  imperialDate: string;
  campaignUrl: string;
  webhookUrl: string;
  isDemoMode?: boolean;
}): Promise<{ ok: boolean; detail: string }> {
  if (params.isDemoMode) {
    return { ok: true, detail: 'Demo dispatch logged (live site relays to Discord via /api/discord-notify.php).' };
  }

  try {
    const res = await fetch('/api/discord-notify.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        message: params.message,
        imperialDate: params.imperialDate,
        campaignUrl: params.campaignUrl,
        webhookUrl: params.webhookUrl,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) {
      return { ok: true, detail: 'Spoiler-free dispatch transmitted to Discord!' };
    }
    return { ok: false, detail: data.error ?? 'Discord dispatch rejected.' };
  } catch {
    return { ok: false, detail: 'Unable to reach /api/discord-notify.php.' };
  }
}
