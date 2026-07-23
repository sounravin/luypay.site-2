import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore using default database unless a custom database ID is explicitly specified
let db;
try {
  const customDbId = firebaseConfig.firestoreDatabaseId;
  if (customDbId && customDbId !== firebaseConfig.projectId && customDbId !== '(default)') {
    db = getFirestore(app, customDbId);
  } else {
    db = getFirestore(app);
  }
} catch (e) {
  db = getFirestore(app);
}

export { app, db };
