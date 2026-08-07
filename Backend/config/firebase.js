const fs = require('fs');
const path = require('path');

let messaging = null;
let initAttempted = false;

function loadServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inlineJson) {
    return JSON.parse(inlineJson);
  }

  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, '..', 'firebase-service-account.json');

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getMessaging() {
  if (initAttempted) {
    return messaging;
  }

  initAttempted = true;

  try {
    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) {
      console.warn('Firebase Admin not configured — push notifications disabled');
      return null;
    }

    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    messaging = admin.messaging();
    console.log('Firebase Admin ready for push notifications');
  } catch (error) {
    console.warn('Firebase Admin init failed:', error.message);
    messaging = null;
  }

  return messaging;
}

module.exports = { getMessaging };
