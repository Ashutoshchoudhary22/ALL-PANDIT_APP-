import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminScreenHeader } from '@/components/AdminScreenHeader';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';

type PlaceholderTabScreenProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  features?: string[];
};

const DEFAULT_FEATURES = [
  'Real-time platform insights',
  'Advanced filters and search',
  'Export and reporting tools',
];

export function PlaceholderTabScreen({
  title,
  subtitle,
  icon,
  features = DEFAULT_FEATURES,
}: PlaceholderTabScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader title={title} subtitle={subtitle} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <PremiumCard style={styles.heroCard} accent="purple">
          <View style={styles.heroInner}>
            <LinearGradient
              colors={['#EDE9FE', '#F5F3FF']}
              style={styles.iconWrap}
            >
              <Ionicons name={icon} size={34} color={C.primary} />
            </LinearGradient>
            <Text style={styles.comingSoon}>Coming Soon</Text>
            <Text style={styles.heroText}>
              We are building a premium {title.toLowerCase()} experience for the admin team.
            </Text>
          </View>
        </PremiumCard>

        <Text style={styles.sectionTitle}>Planned Features</Text>
        {features.map((feature) => (
          <PremiumCard key={feature} style={styles.featureCard} accent="gold">
            <View style={styles.featureRow}>
              <View style={styles.featureDot}>
                <Ionicons name="sparkles" size={14} color={C.gold} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          </PremiumCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.screenBg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  heroCard: {
    marginBottom: 8,
  },
  heroInner: {
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  comingSoon: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: C.primary,
  },
  heroText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: C.textMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  featureCard: {
    marginBottom: 0,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  featureDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
});
