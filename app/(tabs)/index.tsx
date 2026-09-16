import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Lock,
  TrendingUp,
  Coins,
  Wallet,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react-native';
import { Colors, FontSizes, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, GoldRate, Loan } from '@/lib/supabase';
import { formatINR, formatDate } from '@/lib/format';
import { APP_PIN } from '@/lib/config';

export default function DashboardScreen() {
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [goldRates, setGoldRates] = useState<GoldRate[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [ratesRes, loansRes] = await Promise.all([
      supabase.from('gold_rates').select('*').order('purity'),
      supabase
        .from('loans')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
    ]);
    if (ratesRes.data) setGoldRates(ratesRes.data as GoldRate[]);
    if (loansRes.data) setActiveLoans(loansRes.data as Loan[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (unlocked) fetchData();
  }, [unlocked, fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const totalCashOut = activeLoans.reduce(
    (sum, l) => sum + Number(l.principal),
    0
  );
  const totalGoldHeld = activeLoans.reduce(
    (sum, l) => sum + Number(l.net_weight),
    0
  );

  const handlePinPress = (digit: string) => {
    if (pinInput.length >= 4) return;
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setPinError(false);
    if (newPin.length === 4) {
      if (newPin === APP_PIN) {
        setTimeout(() => setUnlocked(true), 200);
      } else {
        setTimeout(() => {
          setPinError(true);
          setPinInput('');
        }, 300);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput(pinInput.slice(0, -1));
    setPinError(false);
  };

  if (!unlocked) {
    return (
      <SafeAreaView style={styles.lockContainer} edges={['bottom']}>
        <LinearGradient
          colors={[Colors.emerald[900], Colors.neutral[950]]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.lockContent}>
          <View style={styles.lockIconWrapper}>
            <Lock size={36} color={Colors.gold[400]} strokeWidth={2} />
          </View>
          <Text style={styles.lockTitle}>SwarnaKhata</Text>
          <Text style={styles.lockSubtitle}>
            Enter your PIN to access the dashboard
          </Text>

          <View style={styles.pinDotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  i < pinInput.length && styles.pinDotFilled,
                  pinError && styles.pinDotError,
                ]}
              />
            ))}
          </View>

          {pinError && (
            <Text style={styles.pinErrorText}>Incorrect PIN. Try again.</Text>
          )}

          <View style={styles.pinPad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.pinKey}
                onPress={() => handlePinPress(d)}
                activeOpacity={0.6}
              >
                <Text style={styles.pinKeyText}>{d}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.pinKeyPlaceholder} />
            <TouchableOpacity
              style={styles.pinKey}
              onPress={() => handlePinPress('0')}
              activeOpacity={0.6}
            >
              <Text style={styles.pinKeyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pinKey}
              onPress={handlePinDelete}
              activeOpacity={0.6}
            >
              <Text style={styles.pinDeleteText}>Del</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pinHint}>Demo PIN: 1234</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold[400]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>SwarnaKhata</Text>
            <Text style={styles.dateText}>
              {formatDate(new Date().toISOString())}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshIcon}
            onPress={onRefresh}
            activeOpacity={0.6}
          >
            <RefreshCw size={20} color={Colors.gold[400]} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.gold[400]}
            style={styles.loader}
          />
        ) : (
          <>
            <LinearGradient
              colors={[Colors.emerald[700], Colors.emerald[900]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cashOutCard}
            >
              <View style={styles.cashOutHeader}>
                <View style={styles.cashOutIconWrapper}>
                  <Wallet size={20} color={Colors.gold[400]} strokeWidth={2} />
                </View>
                <Text style={styles.cashOutLabel}>Total Cash Out</Text>
              </View>
              <Text style={styles.cashOutAmount}>
                {formatINR(totalCashOut)}
              </Text>
              <View style={styles.cashOutFooter}>
                <View style={styles.cashOutStat}>
                  <Text style={styles.cashOutStatValue}>
                    {activeLoans.length}
                  </Text>
                  <Text style={styles.cashOutStatLabel}>Active Loans</Text>
                </View>
                <View style={styles.cashOutDivider} />
                <View style={styles.cashOutStat}>
                  <Text style={styles.cashOutStatValue}>
                    {totalGoldHeld.toFixed(2)}g
                  </Text>
                  <Text style={styles.cashOutStatLabel}>Gold Held</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <TrendingUp size={16} color={Colors.gold[400]} strokeWidth={2} />
                <Text style={styles.sectionHeaderText}>Live Gold Rates</Text>
              </View>
              <Coins size={18} color={Colors.gold[400]} strokeWidth={2} />
            </View>

            <View style={styles.ratesContainer}>
              {goldRates.map((rate) => (
                <View key={rate.id} style={styles.rateCard}>
                  <View style={styles.ratePurityBadge}>
                    <Text style={styles.ratePurityText}>
                      {rate.purity.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.rateValue}>
                    {formatINR(Number(rate.rate_per_gram))}
                  </Text>
                  <Text style={styles.rateUnit}>per gram</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Recent Active Loans</Text>
            </View>

            {activeLoans.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No active loans yet. Create one from the New Loan tab.
                </Text>
              </View>
            ) : (
              activeLoans.slice(0, 5).map((loan) => (
                <View key={loan.id} style={styles.loanRow}>
                  <View style={styles.loanRowLeft}>
                    <Text style={styles.loanCustomerName}>
                      {loan.customer_name}
                    </Text>
                    <Text style={styles.loanMeta}>
                      {loan.purity.toUpperCase()} • {Number(loan.net_weight).toFixed(2)}g net
                    </Text>
                  </View>
                  <View style={styles.loanRowRight}>
                    <Text style={styles.loanAmount}>
                      {formatINR(Number(loan.principal))}
                    </Text>
                    <View style={styles.ltvBadge}>
                      <ArrowUpRight size={11} color={Colors.gold[300]} strokeWidth={2.5} />
                      <Text style={styles.ltvText}>
                        {Number(loan.ltv_percentage).toFixed(0)}% LTV
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  appName: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xxl,
    color: Colors.gold[400],
  },
  dateText: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  refreshIcon: {
    padding: Spacing.sm,
  },
  loader: {
    marginTop: Spacing.xxxl,
  },

  // PIN Lock
  lockContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
  },
  lockContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  lockIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: Colors.gold[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  lockTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xxxl,
    color: Colors.gold[400],
    marginBottom: Spacing.xs,
  },
  lockSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginBottom: Spacing.xxl,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.neutral[500],
  },
  pinDotFilled: {
    backgroundColor: Colors.gold[400],
    borderColor: Colors.gold[400],
  },
  pinDotError: {
    borderColor: Colors.danger,
  },
  pinErrorText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.sm,
    color: Colors.danger,
    marginBottom: Spacing.lg,
  },
  pinPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 260,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  pinKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.neutral[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinKeyPlaceholder: {
    width: 72,
    height: 72,
  },
  pinKeyText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 26,
    color: Colors.textPrimary,
  },
  pinDeleteText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  pinHint: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.neutral[500],
    marginTop: Spacing.xxl,
  },

  // Cash Out Card
  cashOutCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.emerald[600],
    ...Shadows.medium,
  },
  cashOutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cashOutIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashOutLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.sm,
    color: Colors.gold[300],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cashOutAmount: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xxxl,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  cashOutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cashOutStat: {
    flex: 1,
  },
  cashOutStatValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  cashOutStatLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cashOutDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.emerald[700],
    marginHorizontal: Spacing.lg,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionHeaderText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.gold[400],
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Gold Rates
  ratesContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  rateCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  ratePurityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: Colors.gold[600],
    marginBottom: Spacing.md,
  },
  ratePurityText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.xs,
    color: Colors.gold[400],
  },
  rateValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  rateUnit: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Loan Rows
  loanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  loanRowLeft: {
    flex: 1,
  },
  loanCustomerName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  loanMeta: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 3,
  },
  loanRowRight: {
    alignItems: 'flex-end',
  },
  loanAmount: {
    fontFamily: 'Manrope-Bold',
    fontSize: FontSizes.md,
    color: Colors.gold[300],
  },
  ltvBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  ltvText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 10,
    color: Colors.gold[300],
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
