/**
 * Allowed browser origins:
 * - apnaacharya.com (+ subdomains)
 * - localhost / 127.0.0.1 (any port — Expo web & local dev)
 * - LAN IPs 192.168.x.x / 10.x.x.x (phone on same WiFi)
 *
 * Requests without Origin (React Native apps, curl) are allowed.
 */

const DOMAIN_PATTERNS = [
  /^https?:\/\/([a-z0-9-]+\.)*apnaacharya\.com(:\d+)?$/i,
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/i,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/i,
];

function parseExtraOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin) {
  // React Native / Postman / same-server calls often omit Origin.
  if (!origin) return true;

  const extras = parseExtraOrigins();
  if (extras.includes(origin)) return true;

  return DOMAIN_PATTERNS.some((pattern) => pattern.test(origin));
}

function handleCorsOrigin(origin, callback) {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  console.warn(`[CORS] Blocked origin: ${origin}`);
  callback(null, false);
}

function getExpressCorsOptions() {
  return {
    origin: handleCorsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

function getSocketCorsOptions() {
  return {
    origin: handleCorsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  };
}

module.exports = {
  isOriginAllowed,
  getExpressCorsOptions,
  getSocketCorsOptions,
};
