import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore using pure Cloud execution with memoryLocalCache (No persistent browser IndexedDB/LocalStorage quota required)
let db: ReturnType<typeof getFirestore>;
try {
  const customDbId = firebaseConfig.firestoreDatabaseId;
  const dbOptions = {
    localCache: memoryLocalCache()
  };
  if (customDbId && customDbId !== '(default)') {
    db = initializeFirestore(app, dbOptions, customDbId);
  } else {
    db = initializeFirestore(app, dbOptions);
  }
} catch (e) {
  try {
    const customDbId = firebaseConfig.firestoreDatabaseId;
    if (customDbId && customDbId !== '(default)') {
      db = getFirestore(app, customDbId);
    } else {
      db = getFirestore(app);
    }
  } catch (err) {
    db = getFirestore(app);
  }
}

export { app, db };
