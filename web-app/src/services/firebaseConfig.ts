import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

/**
 * Firebase client configuration for the Rimward Verge / SS Aegis Dawn project (`traveller-5a0bc`).
 * Security is strictly enforced server-side by Firebase Authentication + database.rules.json.
 */
export const AEGIS_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBqFzQg12OcCg_GDCThzjZHf1t6ddjwo5g',
  authDomain: 'traveller-5a0bc.firebaseapp.com',
  databaseURL: 'https://traveller-5a0bc-default-rtdb.firebaseio.com',
  projectId: 'traveller-5a0bc',
  storageBucket: 'traveller-5a0bc.firebasestorage.app',
  appId: '1:692954545353:android:40959c48a975e2f3e1e118',
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Database | null = null;

export function getFirebaseServices(): { app: FirebaseApp; auth: Auth; db: Database } {
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApps()[0] : initializeApp(AEGIS_FIREBASE_CONFIG);
  }
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }
  if (!cachedDb) {
    cachedDb = getDatabase(cachedApp);
  }
  return { app: cachedApp, auth: cachedAuth, db: cachedDb };
}
