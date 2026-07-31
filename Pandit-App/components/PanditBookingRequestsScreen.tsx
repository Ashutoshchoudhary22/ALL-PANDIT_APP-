import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, memo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PanditBookingRequestCard } from '@/components/PanditBookingRequestCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import {
  useApproveBookingMutation,
  usePanditBookingRequestsQuery,
  useRejectBookingMutation,
} from '@/hooks/use-pandit-booking-requests';
import { useAuth } from '@/providers/AuthProvider';
import { PanditBooking } from '@/services/booking.api';

type RequestListItemProps = {
  booking: PanditBooking;
  approving: boolean;
  rejecting: boolean;
  onApprove: (booking: PanditBooking) => void;
  onReject: (booking: PanditBooking) => void;
};

const RequestListItem = memo(function RequestListItem({
  booking,
  approving,
  rejecting,
  onApprove,
  onReject,
}: RequestListItemProps) {
  return (
    <PanditBookingRequestCard
      booking={booking}
      approving={approving}
      rejecting={rejecting}
      onApprove={onApprove}
      onReject={onReject}
    />
  );
});

function ListSeparator() {
  return <View style={styles.separator} />;
}

const keyExtractor = (item: PanditBooking) => String(item.id);

export function PanditBookingRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const requestsQuery = usePanditBookingRequestsQuery(Boolean(token));
  const approveBooking = useApproveBookingMutation();
  const rejectBooking = useRejectBookingMutation();
  const requests = requestsQuery.data?.data ?? [];
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void requestsQuery.refetch();
      }
    }, [token, requestsQuery.refetch]),
  );

  const handleApprove = useCallback(async (booking: PanditBooking) => {
    setActiveBookingId(booking.id);
    setActionType('approve');
    try {
      const response = await approveBooking.mutateAsync(booking.id);
      Alert.alert('Approved', response.message);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not approve booking');
    } finally {
      setActiveBookingId(null);
      setActionType(null);
    }
  }, [approveBooking]);

  const handleReject = useCallback((booking: PanditBooking) => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActiveBookingId(booking.id);
          setActionType('reject');
          try {
            const response = await rejectBooking.mutateAsync(booking.id);
            Alert.alert('Rejected', response.message);
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Could not reject booking');
          } finally {
            setActiveBookingId(null);
            setActionType(null);
          }
        },
      },
    ]);
  }, [rejectBooking]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PanditBooking>) => (
      <RequestListItem
        booking={item}
        approving={activeBookingId === item.id && actionType === 'approve'}
        rejecting={activeBookingId === item.id && actionType === 'reject'}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    ),
    [activeBookingId, actionType, handleApprove, handleReject],
  );

  const handleRefresh = useCallback(() => {
    void requestsQuery.refetch();
  }, [requestsQuery.refetch]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Requests</Text>
        <View style={styles.headerSpacer} />
      </View>

      {requestsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            requests.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={ListSeparator}
          refreshControl={
            <RefreshControl refreshing={requestsQuery.isRefetching} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="mail-open-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptySubtitle}>
                New customer booking requests will appear here for your approval.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: C.text },
  headerSpacer: { width: 40 },
  listContent: { padding: 16 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: C.text },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
});
