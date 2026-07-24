const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-applet-config.json');

// Initialize without credential first, it will use default if running in cloud run
// Wait, we need the exact database ID.
initializeApp({
    projectId: serviceAccount.projectId,
});
// Since we don't have the credential file, we will just use REST API using curl and an access token!
