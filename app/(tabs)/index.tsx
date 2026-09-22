import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
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
  LogOut,
} from 'lucide-react-native';
import { Colors, FontSizes, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, GoldRate, Loan } from '@/lib/supabase';
import { formatINR, formatDate } from '@/lib/format';
import { FormField, Button } from '@/components/Form';

export default function DashboardScreen() {
  const [goldRates, setGoldRates] = useState<GoldRate[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditRates, setShowEditRates] = useState(false);
  const [editRatesData, setEditRatesData] = useState<Record<string, string>>({});
  const [savingRates, setSavingRates] = useState(false);

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
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const openEditRates = () => {
    const data: Record<string, string> = {};
    goldRates.forEach(r => {
      data[r.id] = r.rate_per_gram.toString();
    });
    setEditRatesData(data);
    setShowEditRates(true);
  };

  const handleSaveRates = async () => {
    setSavingRates(true);
    for (const [id, value] of Object.entries(editRatesData)) {
      const rate = parseFloat(value);
      if (!isNaN(rate) && rate > 0) {
        await supabase
          .from('gold_rates')
          .update({ rate_per_gram: rate, updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    }
    await fetchData();
    setShowEditRates(false);
    setSavingRates(false);
  };

  const totalCashOut = activeLoans.reduce(
    (sum, l) => sum + Number(l.principal),
    0
  );
  const totalGoldHeld = activeLoans.reduce(
    (sum, l) => sum + Number(l.net_weight),
    0
  );



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
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              style={styles.refreshIcon}
              onPress={onRefresh}
              activeOpacity={0.6}
            >
              <RefreshCw size={20} color={Colors.gold[400]} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refreshIcon}
              onPress={handleLogout}
              activeOpacity={0.6}
            >
              <LogOut size={20} color={Colors.gold[400]} strokeWidth={2} />
            </TouchableOpacity>
          </View>
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
              colors={[Colors.primary, Colors.emerald[800]]}
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
              <Text style={[styles.cashOutAmount, { color: Colors.surface }]}>
                {formatINR(totalCashOut)}
              </Text>
              <View style={styles.cashOutFooter}>
                <View style={styles.cashOutStat}>
                  <Text style={[styles.cashOutStatValue, { color: Colors.surface }]}>
                    {activeLoans.length}
                  </Text>
                  <Text style={styles.cashOutStatLabel}>Active Loans</Text>
                </View>
                <View style={styles.cashOutDivider} />
                <View style={styles.cashOutStat}>
                  <Text style={[styles.cashOutStatValue, { color: Colors.surface }]}>
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
              <TouchableOpacity onPress={openEditRates} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.gold[600] }}>
                <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 11, color: Colors.gold[400], letterSpacing: 0.5 }}>EDIT</Text>
                <Coins size={12} color={Colors.gold[400]} strokeWidth={2} />
              </TouchableOpacity>
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

            <Modal visible={showEditRates} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Edit Gold Rates</Text>
                  
                  {goldRates.map(r => (
                    <FormField
                      key={r.id}
                      label={`${r.purity.toUpperCase()} Price per Gram`}
                      value={editRatesData[r.id] || ''}
                      onChangeText={(t) => setEditRatesData(prev => ({ ...prev, [r.id]: t }))}
                      keyboardType="numeric"
                      placeholder="0"
                      suffix="₹"
                    />
                  ))}

                  <View style={styles.modalActions}>
                    <Button 
                      label="Cancel" 
                      variant="ghost" 
                      onPress={() => setShowEditRates(false)} 
                      style={{ flex: 1, marginRight: Spacing.sm }} 
                    />
                    <Button 
                      label={savingRates ? "Saving..." : "Save Rates"} 
                      variant="gold" 
                      onPress={handleSaveRates} 
                      disabled={savingRates} 
                      style={{ flex: 1, marginLeft: Spacing.sm }} 
                    />
                  </View>
                </View>
              </View>
            </Modal>
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


  // Cash Out Card
  cashOutCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
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
    color: Colors.textPrimary,
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
    color: Colors.textMuted,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.large,
  },
  modalTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
});
