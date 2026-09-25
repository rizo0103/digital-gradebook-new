const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');

let app;

// Safely check if any app has already been initialized
if (getApps().length === 0) {
  if (fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    app = initializeApp({ credential: cert(serviceAccount), projectId: "digital-gradebook" });
  } else {
    app = initializeApp(
      {
        projectId: "digital-gradebook"
      }
    );
  }
} else {
  // If already initialized, look up the existing default app
  app = getApps()[0]; 
}

// Get the Firestore instance using the initialized app
const db = getFirestore(app);

module.exports = { app, db };