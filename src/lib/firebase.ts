import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore with persistentLocalCache to avoid hitting daily read quotas on every refresh
let db: ReturnType<typeof getFirestore>;
try {
  const customDbId = firebaseConfig.firestoreDatabaseId;
  const dbOptions = {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  };
  if (customDbId && customDbId !== '(default)') {
    db = initializeFirestore(app, dbOptions, customDbId);
  } else {
    db = initializeFirestore(app, dbOptions);
  }
} catch (e) {
  try {
    const customDbId = firebaseConfig.firestoreDatabaseId;
    const dbOptions = { localCache: memoryLocalCache() };
    if (customDbId && customDbId !== '(default)') {
      db = initializeFirestore(app, dbOptions, customDbId);
    } else {
      db = initializeFirestore(app, dbOptions);
    }
  } catch (err) {
    db = getFirestore(app);
  }
}

export { app, db, auth };

