import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RazorpayCheckoutModal, RazorpaySuccessPayload } from '@/components/RazorpayCheckoutModal';
import { HomeColors as C } from '@/constants/home-theme';
import { useCreateWalletTopupMutation, useVerifyWalletTopupMutation } from '@/hooks/use-wallet';
import { formatINR } from '@/lib/booking-pricing';
import { BookingCustomerPrefill, BookingPaymentDetails } from '@/services/booking.api';
import { WalletTopupPaymentDetails } from '@/services/wallet.api';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

type AddWalletMoneyModalProps = {
  visible: boolean;
  currentBalance: number;
  onDismiss: () => void;
  onSuccess?: (balance: number) => void;
};

export function AddWalletMoneyModal({
  visible,
  currentBalance,
  onDismiss,
  onSuccess,
}: AddWalletMoneyModalProps) {
  const insets = useSafeAreaInsets();
  const createTopup = useCreateWalletTopupMutation();
  const verifyTopup = useVerifyWalletTopupMutation();
  const [amount, setAmount] = useState('500');
  const [paymentSession, setPaymentSession] = useState<{
    payment: WalletTopupPaymentDetails;
    customer?: BookingCustomerPrefill;
  } | null>(null);

  const selectedAmount = useMemo(() => Math.round(Number(amount) || 0), [amount]);

  const resetState = () => {
    setAmount('500');
    setPaymentSession(null);
  };

  const handleDismiss = () => {
    resetState();
    onDismiss();
  };

  const handleAddMoney = async () => {
    if (selectedAmount < 100 || selectedAmount > 50000) {
      Alert.alert('Invalid Amount', 'Please enter an amount between ₹100 and ₹50,000.');
      return;
    }

    try {
      const response = await createTopup.mutateAsync(selectedAmount);
      setPaymentSession({
        payment: response.payment,
        customer: response.customer,
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not start wallet top-up');
    }
  };

  const handlePaymentSuccess = async (payload: RazorpaySuccessPayload) => {
    try {
      const response = await verifyTopup.mutateAsync(payload);
      setPaymentSession(null);
      Alert.alert('Success', response.message);
      onSuccess?.(response.data.balance);
      handleDismiss();
    } catch (error) {
      setPaymentSession(null);
      Alert.alert(
        'Payment Verification Failed',
        error instanceof Error ? error.message : 'Could not verify wallet top-up',
      );
    }
  };

  return (
    <>
      <Modal visible={visible && !paymentSession} animationType="slide" transparent onRequestClose={handleDismiss}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.header}>
              <Text style={styles.title}>Add Money to Wallet</Text>
              <Pressable onPress={handleDismiss} hitSlop={8}>
                <Ionicons name="close" size={22} color={C.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>{formatINR(currentBalance)}</Text>

            <Text style={styles.sectionLabel}>Choose Amount</Text>
            <View style={styles.presetsRow}>
              {PRESET_AMOUNTS.map((preset) => {
                const active = selectedAmount === preset;
                return (
                  <Pressable
                    key={preset}
                    style={[styles.presetChip, active && styles.presetChipActive]}
                    onPress={() => setAmount(String(preset))}
                  >
                    <Text style={[styles.presetText, active && styles.presetTextActive]}>
                      {formatINR(preset)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Custom Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="Enter amount"
              placeholderTextColor={C.textLight}
            />

            <Pressable
              style={[styles.addBtn, createTopup.isPending && styles.addBtnDisabled]}
              onPress={handleAddMoney}
              disabled={createTopup.isPending}
            >
              {createTopup.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Add {formatINR(selectedAmount || 0)}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <RazorpayCheckoutModal
        visible={Boolean(paymentSession)}
        payment={paymentSession?.payment as BookingPaymentDetails | null}
        customer={paymentSession?.customer}
        description={`Wallet top-up • ${formatINR(paymentSession?.payment.topupAmount ?? 0)}`}
        onSuccess={handlePaymentSuccess}
        onDismiss={() => setPaymentSession(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  balanceLabel: {
    fontSize: 12,
    color: C.textMuted,
  },
  balanceValue: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '800',
    color: C.primary,
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
  },
  presetChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: C.primary,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMuted,
  },
  presetTextActive: {
    color: C.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: C.text,
    backgroundColor: C.background,
  },
  addBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  addBtnDisabled: {
    opacity: 0.7,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
