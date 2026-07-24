const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

admin.initializeApp();
const db = admin.firestore();
db.collection('loan_applications').get().then(snap => {
    snap.forEach(doc => {
        console.log(doc.id, doc.data().lenderId, doc.data().name);
    });
}).catch(console.error);
