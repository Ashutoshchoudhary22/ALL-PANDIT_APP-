import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { BookingCustomerPrefill, BookingPaymentDetails } from '@/services/booking.api';

export type RazorpaySuccessPayload = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

type RazorpayCheckoutModalProps = {
  visible: boolean;
  payment: BookingPaymentDetails | null;
  customer?: BookingCustomerPrefill;
  description: string;
  onSuccess: (payload: RazorpaySuccessPayload) => void;
  onDismiss: () => void;
};

function buildCheckoutHtml(
  payment: BookingPaymentDetails,
  customer: BookingCustomerPrefill | undefined,
  description: string,
) {
  const options = {
    key: payment.keyId,
    amount: payment.amount,
    currency: payment.currency,
    name: 'My-Pandit',
    description,
    order_id: payment.orderId,
    prefill: {
      name: customer?.name || '',
      email: customer?.email || '',
      contact: customer?.contact || '',
    },
    theme: { color: '#FF8C00' },
  };

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  </head>
  <body style="margin:0;background:#fff;">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      function postMessage(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      var options = ${JSON.stringify(options)};
      var opened = false;

      options.handler = function (response) {
        postMessage({
          type: 'success',
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      };

      options.modal = {
        ondismiss: function () {
          if (!opened) return;
          postMessage({ type: 'cancelled' });
        },
      };

      function openCheckout() {
        if (typeof Razorpay === 'undefined') {
          setTimeout(openCheckout, 150);
          return;
        }

        try {
          var rzp = new Razorpay(options);
          rzp.on('payment.failed', function (response) {
            postMessage({
              type: 'failed',
              error:
                (response.error && response.error.description) ||
                'Payment failed. Please try again.',
            });
          });
          opened = true;
          rzp.open();
        } catch (error) {
          postMessage({
            type: 'failed',
            error: error.message || 'Could not open Razorpay checkout',
          });
        }
      }

      openCheckout();
    </script>
  </body>
</html>`;
}

export function RazorpayCheckoutModal({
  visible,
  payment,
  customer,
  description,
  onSuccess,
  onDismiss,
}: RazorpayCheckoutModalProps) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const html = useMemo(
    () => (payment ? buildCheckoutHtml(payment, customer, description) : ''),
    [payment, customer, description],
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type?: 'success' | 'cancelled' | 'failed';
        error?: string;
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
      };

      if (
        payload.type === 'success' &&
        payload.razorpayOrderId &&
        payload.razorpayPaymentId &&
        payload.razorpaySignature
      ) {
        onSuccess({
          razorpayOrderId: payload.razorpayOrderId,
          razorpayPaymentId: payload.razorpayPaymentId,
          razorpaySignature: payload.razorpaySignature,
        });
        return;
      }

      if (payload.type === 'cancelled') {
        onDismiss();
        return;
      }

      if (payload.type === 'failed') {
        setLoading(false);
        setErrorMessage(payload.error || 'Payment could not be started.');
      }
    } catch {
      setErrorMessage('Unexpected payment error. Please try again.');
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setLoading(true);
    webViewRef.current?.reload();
  };

  if (!payment) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <Pressable style={styles.closeBtn} onPress={onDismiss} hitSlop={8}>
            <Ionicons name="close" size={22} color={C.text} />
          </Pressable>
        </View>

        {errorMessage ? (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.webviewWrap}>
            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.loaderText}>Opening Razorpay...</Text>
              </View>
            ) : null}
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html, baseUrl: 'https://my-pandit.app' }}
              onMessage={handleMessage}
              onLoadEnd={() => setLoading(false)}
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              setSupportMultipleWindows
              javaScriptCanOpenWindowsAutomatically
              mixedContentMode="always"
              style={styles.webview}
              onError={() => setErrorMessage('Could not load payment page. Check internet and retry.')}
              {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' as const } : {})}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  webviewWrap: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#fff' },
  loaderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 2,
  },
  loaderText: { marginTop: 12, fontSize: 14, color: C.textMuted },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: C.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '800' },
});
