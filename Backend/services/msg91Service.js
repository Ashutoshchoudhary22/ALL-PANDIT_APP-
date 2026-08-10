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

  if (digits.length === 10) {
    return `${countryCode}${digits}`;
  }

  return digits.startsWith(countryCode) ? digits : `${countryCode}${digits}`;
}

async function parseResponse(response) {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

async function sendSmsOtp({ mobile, otp, expiresInMinutes }) {
  const { authKey, templateId, countryCode } = getConfig();
  if (!authKey || !templateId) {
    throw new Error('MSG91 SMS OTP is not configured');
  }

  const body = {
    template_id: templateId,
    mobile: toInternationalMobile(mobile, countryCode),
    otp: String(otp),
    otp_length: String(String(otp).length),
    otp_expiry: String(expiresInMinutes),
  };

  let response;
  try {
    response = await fetch(MSG91_SEND_OTP_URL, {
      method: 'POST',
      headers: {
        authkey: authKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(`Could not reach MSG91 to send SMS OTP: ${error.message}`);
  }

  const payload = await parseResponse(response);

  if (!response.ok || payload?.type === 'error') {
    const message =
      payload?.message || payload?.error || `MSG91 rejected SMS OTP (${response.status})`;
    console.error('MSG91 SMS OTP error:', { status: response.status, payload, mobile: body.mobile });
    throw new Error(message);
  }

  if (payload?.type !== 'success') {
    console.error('MSG91 SMS OTP unexpected response:', { status: response.status, payload });
    throw new Error(payload?.message || 'MSG91 did not confirm SMS OTP delivery');
  }

  console.log('MSG91 SMS OTP queued:', {
    mobile: body.mobile,
    requestId: payload.request_id || null,
  });

  return payload;
}

module.exports = { sendSmsOtp };
