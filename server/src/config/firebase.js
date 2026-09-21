const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(keyPath);
} catch (error) {
  throw new Error(`Firebase service account is missing at ${keyPath}`);
}

let app;

// Safely check if any app has already been initialized
if (getApps().length === 0) {
  app = initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  // If already initialized, look up the existing default app
  app = getApps()[0]; 
}

// Get the Firestore instance using the initialized app
const db = getFirestore(app);

module.exports = { app, db };