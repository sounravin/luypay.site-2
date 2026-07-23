import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, initializeFirestore } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);

const dbId = config.firestoreDatabaseId;
let db;
if (dbId && dbId !== '(default)') {
  console.log("Using custom DB ID:", dbId);
  db = initializeFirestore(app, {}, dbId);
} else {
  console.log("Using default DB");
  db = getFirestore(app);
}

async function test() {
  try {
    const querySnapshot = await getDocs(collection(db, 'settings'));
    console.log("Success! Docs:", querySnapshot.size);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
