import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import {
  Receipt,
  Share2,
  CheckCircle2,
  User,
  Phone,
  Coins,
  Vault,
  Package,
  Hash,
  Calendar,
  ChevronDown,
} from 'lucide-react-native';
import { Colors, FontSizes, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, Loan } from '@/lib/supabase';
import { formatINR, formatDate, formatTime } from '@/lib/format';
import {
  interestDurationSuffix,
  interestPeriodLabel,
  totalInterest,
} from '@/lib/interest';

export default function ReceiptScreen() {
  const params = useLocalSearchParams<{ loanId?: string }>();
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareSuccess, setShareSuccess] = useState(false);

  const fetchLoan = useCallback(async () => {
    if (!params.loanId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('loans')
      .select('*')
      .eq('id', params.loanId)
      .maybeSingle();
      
    if (data) {
      setSelectedLoan(data as Loan);
    }
    setLoading(false);
  }, [params.loanId]);

  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  const buildReceiptText = (loan: Loan): string => {
    const type = loan.interest_type || 'monthly';
    const perHundred = Number(loan.interest_per_hundred) || 0;
    const duration = Number(loan.duration) || 1;
    const interest = totalInterest(Number(loan.principal), perHundred, duration);
    const lines = [
      '━━━━━━━━━━━━━━━━━━━━━',
      '  SWARNA KHATA',
      '  Gold Loan Receipt',
      '━━━━━━━━━━━━━━━━━━━━━',
      '',
      `Receipt ID: ${loan.id.slice(0, 8).toUpperCase()}`,
      `Date: ${formatDate(loan.created_at)} ${formatTime(loan.created_at)}`,
      '',
      '--- Customer Details ---',
      `Name: ${loan.customer_name}`,
      `Phone: +91 ${loan.phone}`,
      '',
      '--- Gold Details ---',
      `Purity: ${loan.purity.toUpperCase()}`,
      `Gross Weight: ${Number(loan.gross_weight).toFixed(2)} g`,
      `Net Weight: ${Number(loan.net_weight).toFixed(2)} g`,
      '',
      '--- Loan Details ---',
      `Principal: ${formatINR(Number(loan.principal))}`,
      `Interest Type: ${type === 'daily' ? 'Daily' : 'Monthly'}`,
      `Interest Rate: ₹${perHundred} per ₹100 / ${interestPeriodLabel(type)}`,
      `Duration: ${duration} ${interestDurationSuffix(type, duration)}`,
      `Interest Amount: ${formatINR(interest)}`,
      `LTV: ${Number(loan.ltv_percentage).toFixed(1)}%`,
      `Status: ${loan.status.toUpperCase()}`,
      '',
      '--- Vault Assignment ---',
      `Locker: ${loan.locker_number || 'Not assigned'}`,
      `Bag: ${loan.bag_number || 'Not assigned'}`,
      '',
      '━━━━━━━━━━━━━━━━━━━━━',
      '  Thank you for choosing',
      '  SwarnaKhata',
      '━━━━━━━━━━━━━━━━━━━━━',
    ];
    return lines.join('\n');
  };

  const handleShareWhatsApp = async () => {
    if (!selectedLoan) return;

    const receiptText = buildReceiptText(selectedLoan);
    const phone = selectedLoan.phone;
    const countryCode = '91';

    if (Platform.OS === 'web') {
      const message = encodeURIComponent(receiptText);
      const url = `https://wa.me/${countryCode}${phone}?text=${message}`;
      window.open(url, '_blank');
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
      return;
    }

    try {
      const message = encodeURIComponent(receiptText);
      const whatsappUrl = `whatsapp://send?phone=${countryCode}${phone}&text=${message}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        await Share.share({
          message: receiptText,
          title: 'SwarnaKhata Receipt',
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch {
      try {
        await Share.share({
          message: receiptText,
          title: 'SwarnaKhata Receipt',
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch {
        // ignored
      }
    }
  };

  const handleShareGeneric = async () => {
    if (!selectedLoan) return;
    try {
      await Share.share({
        message: buildReceiptText(selectedLoan),
        title: 'SwarnaKhata Receipt',
      });
    } catch {
      // ignored
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ActivityIndicator
          size="large"
          color={Colors.gold[400]}
          style={styles.loader}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerIconWrapper}>
            <Receipt size={22} color={Colors.gold[400]} strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.screenTitle}>Digital Receipt</Text>
            <Text style={styles.screenSubtitle}>
              Share with customer via WhatsApp
            </Text>
          </View>
        </View>

        {!selectedLoan ? (
          <View style={styles.emptyState}>
            <Receipt size={40} color={Colors.neutral[500]} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Receipt not found</Text>
            <Text style={styles.emptyStateText}>
              The loan for this receipt could not be found.
            </Text>
          </View>
        ) : (
          <>
            {/* Receipt Card */}
                <View style={styles.receiptWrapper}>
                  <LinearGradient
                    colors={[Colors.emerald[800], Colors.emerald[900]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1}}
                    style={styles.receiptCard}
                  >
                    {/* Receipt Header */}
                    <View style={styles.receiptHeader}>
                      <View style={styles.receiptLogoWrapper}>
                        <Coins size={24} color={Colors.gold[400]} strokeWidth={2} />
                      </View>
                      <View style={styles.receiptHeaderText}>
                        <Text style={styles.receiptBrandName}>SwarnaKhata</Text>
                        <Text style={styles.receiptTagline}>
                          Gold Loan Receipt
                        </Text>
                      </View>
                    </View>

                    <View style={styles.receiptIdRow}>
                      <Hash size={12} color={Colors.textMuted} strokeWidth={2} />
                      <Text style={styles.receiptIdText}>
                        {selectedLoan.id.slice(0, 8).toUpperCase()}
                      </Text>
                      <View style={styles.receiptDatePill}>
                        <Calendar size={10} color={Colors.gold[300]} strokeWidth={2} />
                        <Text style={styles.receiptDateText}>
                          {formatDate(selectedLoan.created_at)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.receiptDivider} />

                    {/* Customer Details */}
                    <View style={styles.receiptSection}>
                      <Text style={styles.receiptSectionTitle}>
                        CUSTOMER
                      </Text>
                      <View style={styles.receiptInfoRow}>
                        <User size={14} color={Colors.textMuted} strokeWidth={2} />
                        <Text style={styles.receiptInfoLabel}>Name</Text>
                        <Text style={styles.receiptInfoValue}>
                          {selectedLoan.customer_name}
                        </Text>
                      </View>
                      <View style={styles.receiptInfoRow}>
                        <Phone size={14} color={Colors.textMuted} strokeWidth={2} />
                        <Text style={styles.receiptInfoLabel}>Phone</Text>
                        <Text style={styles.receiptInfoValue}>
                          +91 {selectedLoan.phone}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.receiptDivider} />

                    {/* Gold Details */}
                    <View style={styles.receiptSection}>
                      <Text style={styles.receiptSectionTitle}>
                        GOLD DETAILS
                      </Text>
                      <View style={styles.receiptTwoCol}>
                        <View style={styles.receiptColItem}>
                          <Text style={styles.receiptColLabel}>Purity</Text>
                          <Text style={styles.receiptColValue}>
                            {selectedLoan.purity.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.receiptColItem}>
                          <Text style={styles.receiptColLabel}>Gross Wt.</Text>
                          <Text style={styles.receiptColValue}>
                            {Number(selectedLoan.gross_weight).toFixed(2)} g
                          </Text>
                        </View>
                        <View style={styles.receiptColItem}>
                          <Text style={styles.receiptColLabel}>Net Wt.</Text>
                          <Text style={styles.receiptColValue}>
                            {Number(selectedLoan.net_weight).toFixed(2)} g
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.receiptDivider} />

                    {/* Loan Details */}
                    <View style={styles.receiptSection}>
                      <Text style={styles.receiptSectionTitle}>
                        LOAN DETAILS
                      </Text>
                      <View style={styles.receiptAmountRow}>
                        <Text style={styles.receiptAmountLabel}>
                          Principal Lent
                        </Text>
                        <Text style={styles.receiptAmountValue}>
                          {formatINR(Number(selectedLoan.principal))}
                        </Text>
                      </View>
                      <View style={styles.receiptInfoRow}>
                        <Text style={styles.receiptInfoLabel}>Interest Type</Text>
                        <Text style={styles.receiptInfoValue}>
                          {(selectedLoan.interest_type || 'monthly') === 'daily'
                            ? 'Daily'
                            : 'Monthly'}
                        </Text>
                      </View>
                      <View style={styles.receiptInfoRow}>
                        <Text style={styles.receiptInfoLabel}>Rate</Text>
                        <Text style={styles.receiptInfoValue}>
                          ₹{Number(selectedLoan.interest_per_hundred) || 0} / ₹100
                        </Text>
                      </View>
                      <View style={styles.receiptInfoRow}>
                        <Text style={styles.receiptInfoLabel}>Duration</Text>
                        <Text style={styles.receiptInfoValue}>
                          {Number(selectedLoan.duration) || 1}{' '}
                          {interestDurationSuffix(
                            selectedLoan.interest_type || 'monthly',
                            Number(selectedLoan.duration) || 1
                          )}
                        </Text>
                      </View>
                      <View style={styles.receiptInfoRow}>
                        <Text style={styles.receiptInfoLabel}>Interest</Text>
                        <Text style={styles.receiptInfoValue}>
                          {formatINR(
                            totalInterest(
                              Number(selectedLoan.principal),
                              Number(selectedLoan.interest_per_hundred) || 0,
                              Number(selectedLoan.duration) || 1
                            )
                          )}
                        </Text>
                      </View>
                      <View style={styles.receiptInfoRow}>
                        <Text style={styles.receiptInfoLabel}>LTV Ratio</Text>
                        <Text
                          style={[
                            styles.receiptInfoValue,
                            {
                              color:
                                Number(selectedLoan.ltv_percentage) > 75
                                  ? Colors.warning
                                  : Colors.emerald[300],
                            },
                          ]}
                        >
                          {Number(selectedLoan.ltv_percentage).toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.receiptInfoRow}>
                        <Text style={styles.receiptInfoLabel}>Status</Text>
                        <View style={styles.statusBadge}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>
                            {selectedLoan.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.receiptDivider} />

                    {/* Vault Assignment */}
                    <View style={styles.receiptSection}>
                      <Text style={styles.receiptSectionTitle}>
                        VAULT ASSIGNMENT
                      </Text>
                      <View style={styles.receiptTwoCol}>
                        <View style={styles.receiptColItem}>
                          <View style={styles.vaultColHeader}>
                            <Vault size={12} color={Colors.gold[300]} strokeWidth={2} />
                            <Text style={styles.receiptColLabel}>Locker</Text>
                          </View>
                          <Text
                            style={[
                              styles.receiptColValue,
                              !selectedLoan.locker_number &&
                                styles.receiptColValueMuted,
                            ]}
                          >
                            {selectedLoan.locker_number || 'Unassigned'}
                          </Text>
                        </View>
                        <View style={styles.receiptColItem}>
                          <View style={styles.vaultColHeader}>
                            <Package size={12} color={Colors.gold[300]} strokeWidth={2} />
                            <Text style={styles.receiptColLabel}>Bag</Text>
                          </View>
                          <Text
                            style={[
                              styles.receiptColValue,
                              !selectedLoan.bag_number &&
                                styles.receiptColValueMuted,
                            ]}
                          >
                            {selectedLoan.bag_number || 'Unassigned'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.receiptFooterDivider} />

                    <Text style={styles.receiptThankYou}>
                      Thank you for choosing SwarnaKhata
                    </Text>
                  </LinearGradient>
                </View>

                {/* Share Button */}
                {shareSuccess ? (
                  <View style={styles.shareSuccessBar}>
                    <CheckCircle2
                      size={20}
                      color={Colors.emerald[300]}
                      strokeWidth={2}
                    />
                    <Text style={styles.shareSuccessText}>
                      Receipt opened in WhatsApp!
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={handleShareWhatsApp}
                    activeOpacity={0.8}
                  >
                    <Share2 size={22} color={Colors.textPrimary} strokeWidth={2} />
                    <Text style={styles.whatsappButtonText}>
                      Share Receipt via WhatsApp
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.shareOtherButton}
                  onPress={handleShareGeneric}
                  activeOpacity={0.7}
                >
                  <Text style={styles.shareOtherText}>
                    Share via other apps
                  </Text>
                </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  loader: {
    marginTop: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: Colors.gold[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyStateTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptyStateText: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
  },

  // Selector
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  selectorLeft: {
    flex: 1,
  },
  selectorLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.xs,
    color: Colors.gold[400],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  selectorValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  dropdown: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.emerald[700],
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  dropdownItemLeft: {
    flex: 1,
  },
  dropdownItemName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  dropdownItemMeta: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Receipt Card
  receiptWrapper: {
    marginBottom: Spacing.xl,
  },
  receiptCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.gold[600],
    ...Shadows.large,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  receiptLogoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: Colors.gold[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptHeaderText: {
    flex: 1,
  },
  receiptBrandName: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xl,
    color: Colors.gold[400],
  },
  receiptTagline: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  receiptIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  receiptIdText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.xs,
    color: Colors.emerald[300],
  },
  receiptDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  receiptDateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 10,
    color: Colors.gold[300],
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.emerald[700],
    marginVertical: Spacing.md,
  },
  receiptFooterDivider: {
    height: 1,
    backgroundColor: Colors.gold[600],
    marginVertical: Spacing.md,
    opacity: 0.5,
  },
  receiptSection: {},
  receiptSectionTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 10,
    color: Colors.gold[400],
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  receiptInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 5,
  },
  receiptInfoLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.emerald[300],
  },
  receiptInfoValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.surface,
    marginLeft: 'auto',
  },
  receiptAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  receiptAmountLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.md,
    color: Colors.emerald[300],
  },
  receiptAmountValue: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xl,
    color: Colors.gold[400],
  },
  receiptTwoCol: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  receiptColItem: {
    flex: 1,
  },
  vaultColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  receiptColLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.emerald[300],
  },
  receiptColValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.surface,
  },
  receiptColValueMuted: {
    color: Colors.neutral[500],
    fontStyle: 'italic',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: 'rgba(45, 140, 106, 0.15)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.emerald[400],
  },
  statusText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 10,
    color: Colors.emerald[300],
  },
  receiptThankYou: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.sm,
    color: Colors.gold[300],
    textAlign: 'center',
  },

  // Share Button
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.emerald[500],
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.emerald[400],
    ...Shadows.medium,
  },
  whatsappButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: FontSizes.lg,
    color: Colors.surface,
  },
  shareSuccessBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(45, 140, 106, 0.2)',
    borderWidth: 1,
    borderColor: Colors.emerald[400],
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
  },
  shareSuccessText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.emerald[300],
  },
  shareOtherButton: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  shareOtherText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
