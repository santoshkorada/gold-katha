import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ArrowLeft, X, Image as ImageIcon } from 'lucide-react-native';
import { Colors, FontSizes, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, Loan } from '@/lib/supabase';
import { formatINR, formatDate, formatTime } from '@/lib/format';
import { Button } from '@/components/Form';
import {
  InterestType,
  interestDurationSuffix,
  interestPeriodLabel,
  totalInterest,
  generateLedger,
  LedgerState,
} from '@/lib/interest';
import { Transaction } from '@/lib/supabase';

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerState | null>(null);

  // Close loan state
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Payment state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentType, setPaymentType] = useState<'interest_payment' | 'principal_payment'>('interest_payment');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchLoan = useCallback(async () => {
    if (!id) return;
    const { data, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !data) {
      setError('Loan not found.');
      setLoan(null);
    } else {
      setError(null);
      setLoan(data as Loan);
      
      // Fetch transactions
      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('loan_id', id)
        .order('created_at', { ascending: true });
        
      if (txns) {
        setTransactions(txns as Transaction[]);
      }
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLoan();
    }, [fetchLoan])
  );

  const interestType: InterestType =
    loan?.interest_type === 'daily' ? 'daily' : 'monthly';

  // Compute ledger whenever loan or transactions change
  useFocusEffect(
    useCallback(() => {
      if (loan) {
        const state = generateLedger(
          Number(loan.principal),
          Number(loan.interest_per_hundred) || 0,
          interestType,
          loan.created_at,
          transactions
        );
        setLedger(state);
      }
    }, [loan, transactions, interestType])
  );

  const contractedInterest = loan
    ? totalInterest(
        Number(loan.principal),
        Number(loan.interest_per_hundred) || 0,
        Number(loan.duration) || 1
      )
    : 0;

  const totalDue = ledger ? ledger.totalDue : 0;

  const handleCloseLoan = async () => {
    if (!loan) return;
    setClosing(true);

    const { error: updateError } = await supabase
      .from('loans')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', loan.id);

    setClosing(false);

    if (updateError) {
      console.error('Error closing loan:', updateError);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Failed to close loan: ${updateError.message || 'Please try again.'}`);
      } else {
        Alert.alert('Error', `Failed to close loan: ${updateError.message || 'Please try again.'}`);
      }
      return;
    }

    setCloseModalVisible(false);
    fetchLoan();

    // Navigate back automatically after successfully closing the loan
    router.back();
  };

  const handleRecordPayment = async () => {
    if (!loan || !paymentAmount) return;
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    setSavingPayment(true);
    
    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        loan_id: loan.id,
        tenant_id: loan.tenant_id,
        type: paymentType,
        amount: amount
      });
      
    setSavingPayment(false);
    
    if (insertError) {
      Alert.alert('Error', 'Failed to record payment');
      return;
    }
    
    setPaymentModalVisible(false);
    setPaymentAmount('');
    fetchLoan();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Loan details</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.gold[400]}
          style={styles.loader}
        />
      ) : error || !loan || !ledger ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{error || 'Loan not found.'}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <LinearGradient
            colors={[Colors.emerald[800], Colors.emerald[900]]}
            style={styles.summaryCard}
          >
            <Text style={styles.customerName}>{loan.customer_name}</Text>
            <Text style={styles.phone}>+91 {loan.phone}</Text>
            <Text style={styles.principal}>{formatINR(Number(loan.principal))}</Text>
            <Text style={styles.principalHint}>Principal</Text>
            <View style={styles.summaryMeta}>
              <Text style={styles.summaryMetaText}>
                {formatDate(loan.created_at)} {formatTime(loan.created_at)}
              </Text>
              <Text
                style={[
                  styles.summaryStatus,
                  loan.status === 'closed' && { color: Colors.neutral[400] },
                ]}
              >
                {loan.status}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Ledger & Dues</Text>
              {loan.status === 'active' && (
                <TouchableOpacity onPress={() => setPaymentModalVisible(true)} style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.gold[600] }}>
                  <Text style={{ color: Colors.gold[400], fontSize: 12, fontFamily: 'Manrope-Bold' }}>RECORD PAYMENT</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <DetailRow label="Principal Balance" value={formatINR(ledger.currentPrincipal)} />
            <DetailRow label="Unpaid Interest" value={formatINR(ledger.unpaidInterest)} />
            <DetailRow label="Total Due Today" value={formatINR(ledger.totalDue)} valueColor={Colors.gold[400]} />
            
            <View style={styles.divider} />
            <Text style={[styles.sectionTitle, { fontSize: 11, marginBottom: 8 }]}>Transactions</Text>
            {ledger.entries.map((entry, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx === ledger.entries.length - 1 ? 0 : 1, borderBottomColor: Colors.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: Colors.textMuted, fontFamily: 'Manrope-Medium' }}>{formatDate(entry.date.toISOString())}</Text>
                  <Text style={{ fontSize: 13, color: Colors.textPrimary, fontFamily: 'Manrope-SemiBold', marginTop: 2 }}>{entry.description}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                  {entry.interestAccrued ? (
                    <Text style={{ fontSize: 13, color: Colors.warning, fontFamily: 'Manrope-Bold' }}>+{formatINR(entry.interestAccrued)}</Text>
                  ) : null}
                  {entry.principalPaid ? (
                    <Text style={{ fontSize: 13, color: Colors.emerald[400], fontFamily: 'Manrope-Bold' }}>-{formatINR(entry.principalPaid)}</Text>
                  ) : null}
                  {entry.interestPaid ? (
                    <Text style={{ fontSize: 13, color: Colors.emerald[400], fontFamily: 'Manrope-Bold' }}>-{formatINR(entry.interestPaid)}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          {(loan.kyc_type || loan.kyc_number || loan.kyc_image_url) && (
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Customer KYC</Text>
              </View>
              {loan.kyc_type && <DetailRow label="ID Type" value={loan.kyc_type.replace('_', ' ').toUpperCase()} />}
              {loan.kyc_number && <DetailRow label="ID Number" value={loan.kyc_number} />}
              {loan.kyc_image_url && (
                <View style={[styles.imageContainer, { marginTop: Spacing.md }]}>
                  <Image
                    source={{ uri: loan.kyc_image_url }}
                    style={styles.itemImage}
                  />
                </View>
              )}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Gold</Text>
            <DetailRow label="Purity" value={loan.purity.toUpperCase()} />
            <DetailRow
              label="Gross weight"
              value={`${Number(loan.gross_weight).toFixed(2)} g`}
            />
            <DetailRow
              label="Net weight"
              value={`${Number(loan.net_weight).toFixed(2)} g`}
            />
            <DetailRow
              label="LTV"
              value={`${Number(loan.ltv_percentage).toFixed(1)}%`}
              valueColor={
                Number(loan.ltv_percentage) > 90
                  ? Colors.danger
                  : Number(loan.ltv_percentage) > 75
                    ? Colors.warning
                    : Colors.emerald[300]
              }
            />
          </View>

          {loan.item_image_url && (
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Item Photo</Text>
                <ImageIcon size={16} color={Colors.gold[400]} />
              </View>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: loan.item_image_url }}
                  style={styles.itemImage}
                />
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vault</Text>
            <DetailRow
              label="Locker"
              value={loan.locker_number || 'Not assigned'}
            />
            <DetailRow label="Bag" value={loan.bag_number || 'Not assigned'} />
            <DetailRow
              label="Loan ID"
              value={loan.id.slice(0, 8).toUpperCase()}
            />
          </View>

          {loan.status === 'active' && (
            <View style={styles.actionsContainer}>
              <Button
                label="Settle & Close Loan"
                variant="gold"
                onPress={() => setCloseModalVisible(true)}
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* ===== Close Loan / Settlement Modal ===== */}
      <Modal
        visible={closeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCloseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Close & Settle Loan</Text>
                <Text style={styles.modalSubtitle}>{loan?.customer_name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCloseModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.6}
              >
                <X size={20} color={Colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {loan && ledger && (
              <View>
                {/* Settlement Summary */}
                <View style={styles.settlementCard}>
                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Remaining Principal</Text>
                    <Text style={styles.settlementValue}>
                      {formatINR(ledger.currentPrincipal)}
                    </Text>
                  </View>

                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementLabel}>Interest Due</Text>
                    <Text style={[styles.settlementValue, { color: Colors.gold[400] }]}>
                      {formatINR(ledger.unpaidInterest)}
                    </Text>
                  </View>

                  <View style={styles.settlementDivider} />

                  <View style={styles.settlementRow}>
                    <Text style={styles.settlementTotalLabel}>Total Due</Text>
                    <Text style={styles.settlementTotalValue}>
                      {formatINR(ledger.totalDue)}
                    </Text>
                  </View>
                </View>

                {/* Gold return info */}
                <View style={styles.goldReturnInfo}>
                  <Text style={styles.goldReturnText}>
                    Return {Number(loan.gross_weight).toFixed(2)}g gold ({loan.purity.toUpperCase()}) to customer
                  </Text>
                  {loan.locker_number && (
                    <Text style={styles.goldReturnText}>
                      Locker: {loan.locker_number} • Bag: {loan.bag_number}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setCloseModalVisible(false)}
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <Button
                label={closing ? 'Closing...' : 'Confirm Settlement'}
                variant="gold"
                onPress={handleCloseLoan}
                disabled={closing}
                style={{ flex: 1, marginLeft: Spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Record Payment Modal ===== */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Payment</Text>
                <Text style={styles.modalSubtitle}>{loan?.customer_name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPaymentModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.6}
              >
                <X size={20} color={Colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: Spacing.xl }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
                <TouchableOpacity
                  onPress={() => setPaymentType('interest_payment')}
                  style={{ flex: 1, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: paymentType === 'interest_payment' ? Colors.gold[400] : Colors.border, backgroundColor: paymentType === 'interest_payment' ? 'rgba(212, 175, 55, 0.1)' : Colors.surface }}
                >
                  <Text style={{ textAlign: 'center', color: paymentType === 'interest_payment' ? Colors.gold[400] : Colors.textMuted, fontFamily: 'Manrope-Bold' }}>Pay Interest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPaymentType('principal_payment')}
                  style={{ flex: 1, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: paymentType === 'principal_payment' ? Colors.gold[400] : Colors.border, backgroundColor: paymentType === 'principal_payment' ? 'rgba(212, 175, 55, 0.1)' : Colors.surface }}
                >
                  <Text style={{ textAlign: 'center', color: paymentType === 'principal_payment' ? Colors.gold[400] : Colors.textMuted, fontFamily: 'Manrope-Bold' }}>Pay Principal</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: Colors.textSecondary, fontFamily: 'Manrope-SemiBold', marginBottom: 8, fontSize: 13 }}>Amount (₹)</Text>
              <View style={{ backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 16 }}>
                <TextInput
                  style={{ color: Colors.textPrimary, fontSize: 24, fontFamily: 'Manrope-ExtraBold', paddingVertical: 16 }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setPaymentModalVisible(false)}
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <Button
                label={savingPayment ? 'Saving...' : 'Save Payment'}
                variant="gold"
                onPress={handleRecordPayment}
                disabled={savingPayment}
                style={{ flex: 1, marginLeft: Spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  emptyState: {
    padding: Spacing.xl,
  },
  emptyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  summaryCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.emerald[600],
    marginBottom: Spacing.lg,
  },
  customerName: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
  },
  phone: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  principal: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xxxl,
    color: Colors.gold[400],
    marginTop: Spacing.lg,
  },
  principalHint: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  summaryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  summaryMetaText: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  summaryStatus: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.xs,
    color: Colors.emerald[300],
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.gold[400],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  itemImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  accruedAmount: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
  },
  accruedHint: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  detailValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    flex: 1.4,
    textAlign: 'right',
  },
  actionsContainer: {
    marginTop: Spacing.md,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 8, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.emerald[700],
    ...Shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.gold[400],
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },

  // Settlement
  settlementCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settlementLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  settlementValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  settlementDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  settlementTotalLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  settlementTotalValue: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xl,
    color: Colors.gold[400],
  },
  goldReturnInfo: {
    backgroundColor: 'rgba(45, 140, 106, 0.1)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.emerald[700],
    marginBottom: Spacing.sm,
  },
  goldReturnText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.xs,
    color: Colors.emerald[300],
    textAlign: 'center',
    marginVertical: 2,
  },
});
