import { beforeEach, describe, expect, it } from 'vitest';
import {
  createBlankCharacter,
  localMultiTabBackend,
  makeId,
} from '../services/campaignStore';
import type { CampaignSnapshot, UserIdentity } from '../types/campaign';

const REFEREE: UserIdentity = {
  uid: 'ref_1',
  email: 'ref@aegis.test',
  displayName: 'Jacob (Referee)',
  isDemoMode: true,
};

const PLAYER_ALEX: UserIdentity = {
  uid: 'p_alex',
  email: 'alex@aegis.test',
  displayName: 'Alex',
  isDemoMode: true,
};

const PLAYER_SAM: UserIdentity = {
  uid: 'p_sam',
  email: 'sam@aegis.test',
  displayName: 'Sam',
  isDemoMode: true,
};

describe('Campaign Store Privacy Segregation (Mind-Virus, DMs & Referee Wiretap)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('isolates covert Mind-Virus directives and private DMs so other players cannot see them', async () => {
    const code = 'TEST01';
    await localMultiTabBackend.createOrJoinCampaign(code, REFEREE, true);
    await localMultiTabBackend.createOrJoinCampaign(code, PLAYER_ALEX, false);
    await localMultiTabBackend.createOrJoinCampaign(code, PLAYER_SAM, false);

    // Referee injects a Mind-Virus strictly into Alex's private slice
    await localMultiTabBackend.injectDirective(code, PLAYER_ALEX.uid, {
      id: 'dir_virus_1',
      title: 'STAGE-1 CHIMERA NEURO-PARASITE',
      body: 'Keep the airlock override code secret.',
      isMindVirus: true,
      createdAt: Date.now(),
    });

    // Referee sends a private DM to Alex
    await localMultiTabBackend.sendDirectMessage(
      code,
      REFEREE,
      PLAYER_ALEX.uid,
      PLAYER_ALEX.displayName,
      'You hear a hum behind the bulkhead.',
      { asAriaWhisper: true }
    );

    let alexSnap: CampaignSnapshot | null = null;
    let samSnap: CampaignSnapshot | null = null;
    let refSnap: CampaignSnapshot | null = null;

    const u1 = localMultiTabBackend.subscribe(code, PLAYER_ALEX, (s) => {
      alexSnap = s;
    });
    const u2 = localMultiTabBackend.subscribe(code, PLAYER_SAM, (s) => {
      samSnap = s;
    });
    const u3 = localMultiTabBackend.subscribe(code, REFEREE, (s) => {
      refSnap = s;
    });

    // Alex sees her covert Mind-Virus & her private DM, but NOT refereeOnly
    expect(Object.keys(alexSnap!.myPrivate.directives)).toContain('dir_virus_1');
    expect(alexSnap!.dmThreads).toHaveLength(1);
    expect(alexSnap!.refereeOnly).toBeNull();

    // Sam sees ZERO directives and ZERO of Alex's DMs!
    expect(Object.keys(samSnap!.myPrivate.directives)).toHaveLength(0);
    expect(samSnap!.dmThreads).toHaveLength(0);
    expect(samSnap!.refereeOnly).toBeNull();

    // Referee sees allPrivates (active infection) AND DM Wiretap AND refereeOnly
    expect(Object.keys(refSnap!.allPrivates[PLAYER_ALEX.uid].directives)).toContain('dir_virus_1');
    expect(refSnap!.dmThreads).toHaveLength(1);
    expect(refSnap!.refereeOnly?.ariaTier).toBe(1);

    // Clearing the infection removes it from Alex
    await localMultiTabBackend.clearDirective(code, PLAYER_ALEX.uid, 'dir_virus_1');
    let afterCure: CampaignSnapshot | null = null;
    const u4 = localMultiTabBackend.subscribe(code, PLAYER_ALEX, (s) => {
      afterCure = s;
    });
    expect(Object.keys(afterCure!.myPrivate.directives)).toHaveLength(0);

    u1();
    u2();
    u3();
    u4();
  });

  it('persists Session 0 characters, bulletin votes, and private spotlight rulings', async () => {
    const code = 'TEST02';
    await localMultiTabBackend.createOrJoinCampaign(code, REFEREE, true);
    await localMultiTabBackend.createOrJoinCampaign(code, PLAYER_ALEX, false);

    const char = createBlankCharacter(PLAYER_ALEX.uid, PLAYER_ALEX.displayName, 'Kallie Reyes');
    await localMultiTabBackend.saveCharacter(code, char);
    await localMultiTabBackend.bindMemberCharacter(code, PLAYER_ALEX.uid, char.id);

    await localMultiTabBackend.submitSpotlight(code, {
      id: makeId('spot'),
      uid: PLAYER_ALEX.uid,
      characterName: char.name,
      prompt: 'Tap into Port Breakwater customs log.',
      status: 'PENDING',
      submittedAt: Date.now(),
    });
    await localMultiTabBackend.resolveSpotlight(code, PLAYER_ALEX.uid, 'You uncover K-REN patrol schedules.');

    let alexSnap: CampaignSnapshot | null = null;
    const u = localMultiTabBackend.subscribe(code, PLAYER_ALEX, (s) => {
      alexSnap = s;
    });

    expect(alexSnap!.characters[char.id].name).toBe('Kallie Reyes');
    expect(alexSnap!.myPrivate.spotlight?.status).toBe('RESOLVED');
    expect(alexSnap!.myPrivate.spotlight?.refereeReply).toContain('K-REN');
    u();
  });
});
