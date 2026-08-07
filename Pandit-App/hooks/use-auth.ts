import { useMutation } from '@tanstack/react-query';

import {
  forgotPasswordApi,
  ForgotPasswordPayload,
  loginApi,
  LoginPayload,
  resendOtpApi,
  resetPasswordApi,
  ResetPasswordPayload,
  signupApi,
  SignupPayload,
  verifyOtpApi,
  VerifyOtpPayload,
} from '@/services/auth.api';

export function useSignupMutation() {
  return useMutation({
    mutationFn: (payload: SignupPayload) => signupApi(payload),
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => forgotPasswordApi(payload),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPasswordApi(payload),
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => verifyOtpApi(payload),
  });
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: (payload: { mobile?: string; email?: string }) => resendOtpApi(payload),
  });
}
