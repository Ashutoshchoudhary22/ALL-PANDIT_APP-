const MSG91_SEND_OTP_URL = 'https://control.msg91.com/api/v5/otp';

function getConfig() {
  return {
    authKey: process.env.MSG91_AUTH_KEY?.trim(),
    templateId: process.env.MSG91_OTP_TEMPLATE_ID?.trim(),
    countryCode: (process.env.MSG91_COUNTRY_CODE || '91').trim(),
  };
}

function toInternationalMobile(mobile, countryCode) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (!digits) {
    throw new Error('A valid mobile number is required for SMS OTP');
  }

  return digits.startsWith(countryCode) ? digits : `${countryCode}${digits}`;
}

async function sendSmsOtp({ mobile, otp, expiresInMinutes }) {
  const { authKey, templateId, countryCode } = getConfig();
  if (!authKey || !templateId) {
    throw new Error('MSG91 SMS OTP is not configured');
  }

  const params = new URLSearchParams({
    template_id: templateId,
    mobile: toInternationalMobile(mobile, countryCode),
    otp: String(otp),
    otp_length: String(String(otp).length),
    otp_expiry: String(expiresInMinutes),
  });

  let response;
  try {
    response = await fetch(`${MSG91_SEND_OTP_URL}?${params.toString()}`, {
      headers: {
        authkey: authKey,
        Accept: 'application/json',
      },
    });
  } catch {
    throw new Error('Could not reach MSG91 to send SMS OTP');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // MSG91 error responses are occasionally plain text.
  }

  if (!response.ok || payload?.type === 'error') {
    throw new Error(payload?.message || payload?.error || 'MSG91 could not send SMS OTP');
  }

  return payload;
}

module.exports = { sendSmsOtp };
