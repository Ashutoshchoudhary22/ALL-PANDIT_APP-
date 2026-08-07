import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLanguage } from '@/constants/i18n';
import { TranslationKey } from '@/constants/i18n/en';
import { HomeColors as C } from '@/constants/home-theme';
import { CUSTOMER_LANGUAGE_OPTIONS } from '@/lib/customer-preferences';
import { useTranslation } from '@/providers/LanguageProvider';

type LanguageSelectModalProps = {
  visible: boolean;
  selectedCode?: string | null;
  saving?: boolean;
  onClose: () => void;
  onSelect: (code: AppLanguage) => void;
};

const LANGUAGE_META: Record<
  AppLanguage,
  {
    labelKey: TranslationKey;
    nativeLabel: string;
    subtitleKey: TranslationKey;
    icon: keyof typeof Ionicons.glyphMap;
    accent: string;
    accentSoft: string;
  }
> = {
  en: {
    labelKey: 'language.en',
    nativeLabel: 'English',
    subtitleKey: 'profile.language.englishHint',
    icon: 'globe-outline',
    accent: '#2563EB',
    accentSoft: '#EFF6FF',
  },
  hi: {
    labelKey: 'language.hi',
    nativeLabel: 'हिंदी',
    subtitleKey: 'profile.language.hindiHint',
    icon: 'language-outline',
    accent: C.primary,
    accentSoft: '#FFF0E0',
  },
};

export function LanguageSelectModal({
  visible,
  selectedCode,
  saving = false,
  onClose,
  onSelect,
}: LanguageSelectModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Close" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />

          <LinearGradient
            colors={['#FFF8F0', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerIconWrap}>
              <Ionicons name="language" size={24} color={C.maroon} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{t('profile.language.selectTitle')}</Text>
              <Text style={styles.subtitle}>{t('profile.language.selectMessage')}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8} disabled={saving}>
              <Ionicons name="close" size={20} color={C.textMuted} />
            </Pressable>
          </LinearGradient>

          <View style={styles.options}>
            {CUSTOMER_LANGUAGE_OPTIONS.map((option) => {
              const code = option.code as AppLanguage;
              const meta = LANGUAGE_META[code];
              const isSelected = selectedCode === option.code;

              return (
                <Pressable
                  key={option.code}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    pressed && !saving && styles.optionCardPressed,
                    saving && styles.optionCardDisabled,
                  ]}
                  onPress={() => onSelect(code)}
                  disabled={saving || isSelected}
                >
                  <View style={[styles.optionIconWrap, { backgroundColor: meta.accentSoft }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.accent} />
                  </View>

                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionTitle}>{t(meta.labelKey)}</Text>
                    <Text style={styles.optionNative}>{meta.nativeLabel}</Text>
                    <Text style={styles.optionHint}>{t(meta.subtitleKey)}</Text>
                  </View>

                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected ? (
                      saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
            onPress={onClose}
            disabled={saving}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(61, 21, 21, 0.45)',
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderGold,
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 160, 23, 0.18)',
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.borderGold,
  },
  headerTextWrap: {
    flex: 1,
    paddingTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: C.maroon,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: C.textMuted,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  options: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
  },
  optionCardSelected: {
    borderColor: C.primary,
    backgroundColor: '#FFFBF5',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  optionCardPressed: {
    opacity: 0.92,
  },
  optionCardDisabled: {
    opacity: 0.85,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  optionNative: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: C.maroon,
  },
  optionHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: C.textMuted,
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOuterSelected: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  cancelBtn: {
    marginTop: 8,
    marginHorizontal: 16,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  cancelBtnPressed: {
    opacity: 0.9,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.maroon,
  },
});
