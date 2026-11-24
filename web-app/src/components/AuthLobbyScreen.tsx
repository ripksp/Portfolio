import React, { useState } from 'react';
import { Copy, Check, Shield, Terminal, Users, LogIn, UserPlus, Sparkles } from 'lucide-react';
import {
  firebaseSignIn,
  firebaseSignUp,
  normalizeCampaignCode,
} from '../services/campaignStore';
import type { UserIdentity } from '../types/campaign';

interface AuthLobbyScreenProps {
  initialCampaignCode: string;
  currentUser: UserIdentity | null;
  onAuthenticated: (user: UserIdentity, campaignCode: string, asReferee: boolean) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const AuthLobbyScreen: React.FC<AuthLobbyScreenProps> = ({
  initialCampaignCode,
  currentUser,
  onAuthenticated,
  onSignOut,
}) => {
  const [authTab, setAuthTab] = useState<'SIGNIN' | 'SIGNUP'>('SIGNIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [campaignCode, setCampaignCode] = useState(normalizeCampaignCode(initialCampaignCode || 'AEGS'));
  const [asReferee, setAsReferee] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const normalizedCode = normalizeCampaignCode(campaignCode);
  const inviteUrl = `${window.location.origin}${window.location.pathname}#/?c=${normalizedCode}`;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored
    }
  };

  const handleLiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let user = currentUser;
      if (!user || user.isDemoMode) {
        if (!email.trim() || !password) {
          throw new Error('Enter your email and password to sync across devices.');
        }
        if (authTab === 'SIGNUP') {
          if (!displayName.trim()) {
            throw new Error('Enter your player name / callsign.');
          }
          user = await firebaseSignUp(email, password, displayName);
        } else {
          user = await firebaseSignIn(email, password);
        }
      }
      await onAuthenticated(user, normalizedCode, asReferee);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to Firebase.';
      setError(
        msg.includes('operation-not-allowed')
          ? 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication -> Sign-in method -> Email/Password). Use Local Sandbox below to test right now!'
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  const launchDemoPersona = async (role: 'REFEREE' | 'PLAYER_1' | 'PLAYER_2') => {
    setError(null);
    setBusy(true);
    try {
      const personaMap: Record<typeof role, UserIdentity> = {
        REFEREE: {
          uid: 'demo_referee_jacob',
          email: 'referee@aegisdawn.local',
          displayName: 'Jacob (Referee)',
          isDemoMode: true,
        },
        PLAYER_1: {
          uid: 'demo_player_alex',
          email: 'alex@aegisdawn.local',
          displayName: 'Alex',
          isDemoMode: true,
        },
        PLAYER_2: {
          uid: 'demo_player_sam',
          email: 'sam@aegisdawn.local',
          displayName: 'Sam',
          isDemoMode: true,
        },
      };
      await onAuthenticated(personaMap[role], normalizedCode, role === 'REFEREE');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sandbox.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card stack-md" aria-label="Aegis Dawn Campaign Sign In">
        <div className="row-between">
          <div>
            <h1 className="auth-hero-title">SS AEGIS DAWN // CAMPAIGN OS</h1>
            <p className="helper-text">
              The Rimward Verge • Mongoose Traveller 2e Live Table &amp; Jump-Space Hub
            </p>
          </div>
          <img
            src="/aegis/assets/tokens/token_starship_scout.png"
            alt="SS Aegis Dawn emblem"
            className="token-avatar"
          />
        </div>

        <div className="status-ticker">
          <span>
            INVITE LINK: <strong>{normalizedCode}</strong>
          </span>
          <button type="button" className="btn btn-sm" onClick={copyInvite} id="copy-invite-btn">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'COPIED' : 'COPY LINK'}
          </button>
        </div>

        <form onSubmit={handleLiveSubmit} className="stack-sm">
          {!currentUser || currentUser.isDemoMode ? (
            <>
              <div className="tab-strip">
                <button
                  type="button"
                  className={`tab-chip ${authTab === 'SIGNIN' ? 'active' : ''}`}
                  onClick={() => setAuthTab('SIGNIN')}
                  id="auth-tab-signin"
                >
                  <LogIn size={14} /> SIGN IN
                </button>
                <button
                  type="button"
                  className={`tab-chip ${authTab === 'SIGNUP' ? 'active' : ''}`}
                  onClick={() => setAuthTab('SIGNUP')}
                  id="auth-tab-signup"
                >
                  <UserPlus size={14} /> NEW ACCOUNT
                </button>
              </div>

              {authTab === 'SIGNUP' && (
                <div className="field">
                  <label htmlFor="auth-name">Player Name / Callsign</label>
                  <input
                    id="auth-name"
                    className="input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Jacob, Alex, Sam"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="crew@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete={authTab === 'SIGNUP' ? 'new-password' : 'current-password'}
                />
              </div>
            </>
          ) : (
            <div className="card card-accent row-between">
              <div>
                <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--accent-phosphor)' }}>
                  SIGNED IN
                </div>
                <strong>{currentUser.displayName}</strong>{' '}
                <span className="helper-text">({currentUser.email})</span>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => void onSignOut()}>
                SIGN OUT
              </button>
            </div>
          )}

          <div className="grid-2">
            <div className="field">
              <label htmlFor="campaign-code">Campaign Code</label>
              <input
                id="campaign-code"
                className="input mono"
                value={campaignCode}
                onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
                maxLength={12}
                placeholder="AEGS"
              />
            </div>

            <div className="field">
              <label>Seat Role (If Creating New)</label>
              <div className="row-wrap" style={{ paddingTop: 4 }}>
                <button
                  type="button"
                  className={`tab-chip ${!asReferee ? 'active' : ''}`}
                  onClick={() => setAsReferee(false)}
                >
                  <Users size={14} /> PLAYER
                </button>
                <button
                  type="button"
                  className={`tab-chip ${asReferee ? 'active' : ''}`}
                  onClick={() => setAsReferee(true)}
                >
                  <Shield size={14} /> REFEREE
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="card card-alert" role="alert" style={{ padding: 10 }}>
              <strong style={{ color: 'var(--accent-alert)' }}>AUTH NOTICE:</strong>{' '}
              <span style={{ fontSize: '0.86rem' }}>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={busy} id="live-connect-btn">
            <Terminal size={15} />
            {busy ? 'ESTABLISHING UPLINK...' : `CONNECT TO CAMPAIGN [${normalizedCode}]`}
          </button>
        </form>

        <div className="divider" />

        <div className="stack-sm">
          <div className="row-between">
            <span className="section-title amber" style={{ fontSize: '0.76rem' }}>
              <Sparkles size={14} /> INSTANT MULTI-TAB SANDBOX (OFFLINE / NO LOGIN)
            </span>
          </div>
          <p className="helper-text" style={{ fontSize: '0.8rem' }}>
            Open two tabs side-by-side to rehearse Session 0, live rolls, and Mind-Virus whispers in real time before Thanksgiving.
          </p>
          <div className="row-wrap">
            <button
              type="button"
              className="btn btn-amber btn-sm"
              disabled={busy}
              onClick={() => void launchDemoPersona('REFEREE')}
              id="demo-referee-btn"
            >
              <Shield size={13} /> ENTER AS REFEREE
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={busy}
              onClick={() => void launchDemoPersona('PLAYER_1')}
              id="demo-player1-btn"
            >
              <Users size={13} /> PLAYER 1 (ALEX)
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={busy}
              onClick={() => void launchDemoPersona('PLAYER_2')}
              id="demo-player2-btn"
            >
              <Users size={13} /> PLAYER 2 (SAM)
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
