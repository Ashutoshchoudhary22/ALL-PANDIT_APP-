import { AUTH_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/lib/axios';

export type SignupPayload = {
  mobile: string;
  email?: string;
  password: string;
  role?: 'pandit';
};

export type SignupResponse = {
  success: boolean;
  message: string;
  data?: {
    mobile: string;
    email?: string;
    role?: string;
    otp?: string;
  };
};

export type VerifyOtpPayload = {
  mobile?: string;
  email?: string;
  otp: string;
};

export type AuthUser = {
  id: number;
  role: string;
  mobile: string;
  email: string | null;
  profileImage: string | null;
  languageCode: string;
  status: string;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    token: string;
  };
};

export type LoginPayload = {
  email?: string;
  mobile?: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    token: string;
  };
};

export async function signupApi(payload: SignupPayload) {
  const { data } = await apiClient.post<SignupResponse>(
    AUTH_ENDPOINTS.signup,
    { ...payload, role: 'pandit' },
  );
  return data;
}

export async function verifyOtpApi(payload: VerifyOtpPayload) {
  const { data } = await apiClient.post<VerifyOtpResponse>(
    AUTH_ENDPOINTS.verifyOtp,
    payload,
  );
  return data;
}

export async function resendOtpApi(payload: { mobile?: string; email?: string }) {
  const { data } = await apiClient.post<{ success: boolean; message: string; otp?: string }>(
    AUTH_ENDPOINTS.resendOtp,
    payload,
  );
  return data;
}

export async function loginApi(payload: LoginPayload) {
  const { data } = await apiClient.post<LoginResponse>(
    AUTH_ENDPOINTS.login,
    payload,
  );
  return data;
}

export type ForgotPasswordPayload = {
  email?: string;
  mobile?: string;
};

export type ForgotPasswordResponse = {
  success: boolean;
  message: string;
};

export async function forgotPasswordApi(payload: ForgotPasswordPayload) {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    AUTH_ENDPOINTS.forgotPassword,
    payload,
  );
  return data;
}

export async function getMeApi() {
  const { data } = await apiClient.get<{ success: boolean; data: { user: AuthUser } }>(
    AUTH_ENDPOINTS.me,
  );
  return data;
}
