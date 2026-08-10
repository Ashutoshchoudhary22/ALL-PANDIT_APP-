const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging: getFirebaseMessaging } = require('firebase-admin/messaging');

let messaging = null;
let initAttempted = false;

function normalizeServiceAccount(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const account = { ...raw };

  if (typeof account.private_key === 'string') {
    account.private_key = account.private_key.replace(/\\n/g, '\n');
  }

  const requiredFields = ['project_id', 'client_email', 'private_key'];
  for (const field of requiredFields) {
    if (typeof account[field] !== 'string' || !account[field].trim()) {
      console.warn(`Firebase service account is missing required field: ${field}`);
      return null;
    }
  }

  return account;
}

function parseInlineServiceAccount(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  return JSON.parse(Buffer.from(trimmed, 'base64').toString('utf8'));
}

function loadServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inlineJson) {
    try {
      return normalizeServiceAccount(parseInlineServiceAccount(inlineJson));
    } catch (error) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
      return null;
    }
  }

  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, '..', 'firebase-service-account.json');

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return normalizeServiceAccount(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } catch (error) {
    console.warn('Failed to read Firebase service account file:', error.message);
    return null;
  }
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

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    messaging = getFirebaseMessaging();
    console.log('Firebase Admin ready for push notifications');
  } catch (error) {
    console.warn('Firebase Admin init failed:', error.message);
    messaging = null;
  }

  return messaging;
}

module.exports = { getMessaging };
