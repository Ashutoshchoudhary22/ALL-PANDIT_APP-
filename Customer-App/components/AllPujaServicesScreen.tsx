import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PujaServiceIcon } from '@/components/PujaServiceIcon';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { PUJA_SERVICE_OPTIONS } from '@/constants/puja-services';
import { HomeColors as C } from '@/constants/home-theme';
import { openPanditsForService } from '@/lib/pandit-navigation';
import { useTranslation } from '@/providers/LanguageProvider';

const PUJA_SERVICE_HI_LABELS: Record<string, string> = {
  'Marriage Puja': 'विवाह पूजा',
  'Griha Pravesh': 'गृह प्रवेश',
  'Satyanarayan Katha': 'सत्यनारायण कथा',
  'Birthday Puja': 'जन्मदिन पूजा',
  'Sunderkand Path': 'सुंदरकांड पाठ',
  'Business Opening': 'व्यवसाय आरंभ पूजा',
  Havan: 'हवन',
  'Navratri Puja': 'नवरात्रि पूजा',
  'Bhagwat Katha': 'भागवत कथा',
  Shradh: 'श्राद्ध',
  Rudrabhishek: 'रुद्राभिषेक',
  Mundan: 'मुंडन संस्कार',
  'Mahamrityunjaya Jaap': 'महामृत्युंजय जाप',
  'Ganesh Puja': 'गणेश पूजा',
  'Lakshmi Puja': 'लक्ष्मी पूजा',
  'Saraswati Puja': 'सरस्वती पूजा',
  'Durga Puja': 'दुर्गा पूजा',
  'Kali Puja': 'काली पूजा',
  'Shiv Puja': 'शिव पूजा',
  'Vishnu Puja': 'विष्णु पूजा',
  'Ram Katha': 'राम कथा',
  'Shiv Mahapuran Katha': 'शिव महापुराण कथा',
  'Akhand Ramayan Path': 'अखंड रामायण पाठ',
  'Hanuman Chalisa Path': 'हनुमान चालीसा पाठ',
  'Grah Shanti Puja': 'ग्रह शांति पूजा',
  'Navgraha Puja': 'नवग्रह पूजा',
  'Vastu Shanti Puja': 'वास्तु शांति पूजा',
  'Bhoomi Pujan': 'भूमि पूजन',
  'Shilanyas Puja': 'शिलान्यास पूजा',
  'Office Puja': 'ऑफिस पूजा',
  'Shop Opening Puja': 'दुकान उद्घाटन पूजा',
  'Vehicle Puja': 'वाहन पूजा',
  'Factory Puja': 'फैक्ट्री पूजा',
  'Lakshmi Kuber Puja': 'लक्ष्मी कुबेर पूजा',
  'Dhanteras Puja': 'धनतेरस पूजा',
  'Ayudha Puja': 'आयुध पूजा',
  'Namkaran Sanskar': 'नामकरण संस्कार',
  'Annaprashan Sanskar': 'अन्नप्राशन संस्कार',
  'Vidyarambh Sanskar': 'विद्यारंभ संस्कार',
  'Janeu Sanskar': 'जनेऊ संस्कार',
  'Engagement Puja': 'सगाई पूजा',
  'Wedding Anniversary Puja': 'विवाह वर्षगांठ पूजा',
  'Baby Shower Puja': 'गोद भराई पूजा',
  'Kaal Sarp Dosh Puja': 'काल सर्प दोष पूजा',
  'Mangal Dosh Puja': 'मंगल दोष पूजा',
  'Pitra Dosh Puja': 'पितृ दोष पूजा',
  'Shani Shanti Puja': 'शनि शांति पूजा',
  'Rahu Ketu Shanti Puja': 'राहु केतु शांति पूजा',
  'Chandi Path': 'चंडी पाठ',
  'Gayatri Havan': 'गायत्री हवन',
  'Chandi Havan': 'चंडी हवन',
  'Sudarshan Havan': 'सुदर्शन हवन',
  'Putra Kameshti Yagya': 'पुत्र कामेष्टि यज्ञ',
  'Antyeshti Sanskar': 'अंत्येष्टि संस्कार',
  'Terahvi Kriya': 'तेहरवीं क्रिया',
  'Asthi Visarjan': 'अस्थि विसर्जन',
  'Narayan Bali Puja': 'नारायण बली पूजा',
  'Tripindi Shradh': 'त्रिपिंडी श्राद्ध',
};

function getPujaServiceLabel(name: string, language: 'en' | 'hi') {
  if (language === 'hi') {
    return PUJA_SERVICE_HI_LABELS[name] ?? name;
  }

  return name;
}

export function AllPujaServicesScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return PUJA_SERVICE_OPTIONS;
    return PUJA_SERVICE_OPTIONS.filter((name) => {
      const englishLabel = name.toLowerCase();
      const translatedLabel = getPujaServiceLabel(name, language).toLowerCase();
      return englishLabel.includes(query) || translatedLabel.includes(query);
    });
  }, [language, search]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.maroon, C.maroonLight, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={C.maroon} />
          </Pressable>
          <View style={styles.headerBadge}>
            <Ionicons name="flame" size={18} color={C.maroon} />
            <Text style={styles.headerBadgeCount}>{PUJA_SERVICE_OPTIONS.length}</Text>
            <Text style={styles.headerBadgeLabel}>{t('allPuja.badge.services')}</Text>
          </View>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerOm}>ॐ</Text>
          <Text style={styles.headerTitle}>{t('allPuja.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('allPuja.subtitle')}</Text>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} width={180} />
        </View>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={C.maroon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('allPuja.searchPlaceholder')}
          placeholderTextColor={C.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
          filteredServices.length === 0 && styles.emptyList,
        ]}
        renderItem={({ item, index }) => (
          <Pressable style={styles.serviceCardWrap} onPress={() => openPanditsForService(item)}>
            <PremiumCard accent={index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'saffron' : 'maroon'} innerStyle={styles.serviceCardInner}>
              <PujaServiceIcon name={item} index={index} size="lg" />
              <Text style={styles.serviceName} numberOfLines={3}>
                {getPujaServiceLabel(item, language)}
              </Text>
            </PremiumCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={36} color={C.maroon} />
              <Text style={styles.emptyTitle}>{t('allPuja.empty.title')}</Text>
              <Text style={styles.emptySubtitle}>{t('allPuja.empty.subtitle')}</Text>
            </View>
          </PremiumCard>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  headerContent: { paddingHorizontal: 2 },
  headerOm: { fontSize: 14, color: C.goldLight, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,248,240,0.85)',
    fontWeight: '500',
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: C.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
    minWidth: 72,
  },
  headerBadgeCount: { marginTop: 2, fontSize: 18, fontWeight: '800', color: C.maroon },
  headerBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerDividerWrap: { alignItems: 'center', marginTop: 12 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },
  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  emptyList: { flexGrow: 1 },
  gridRow: { gap: 12, marginBottom: 12 },
  serviceCardWrap: { flex: 1 },
  serviceCardInner: {
    padding: 14,
    alignItems: 'center',
    minHeight: 130,
    gap: 10,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '800',
    color: C.maroon,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyCardInner: { padding: 28 },
  emptyWrap: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.maroon },
  emptySubtitle: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
});
