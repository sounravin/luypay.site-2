import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, initializeFirestore } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const dbId = config.firestoreDatabaseId;

const db = initializeFirestore(app, {}, dbId);
console.log("Fetching docs from:", dbId);

setTimeout(() => {
  console.log("Timeout reached!");
  process.exit(1);
}, 3000);

getDocs(collection(db, 'borrowers')).then(snapshot => {
  console.log("Success:", snapshot.size);
  process.exit(0);
}).catch(err => {
  console.error("Firebase error:", err.code, err.message);
  process.exit(1);
});
