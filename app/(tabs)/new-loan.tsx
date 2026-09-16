import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CheckCircle2, AlertCircle, Calculator } from 'lucide-react-native';
import { Colors, FontSizes, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, GoldRate } from '@/lib/supabase';
import { formatINR } from '@/lib/format';
import { FormField, DropdownField, Button } from '@/components/Form';

const PURITY_OPTIONS = [
  { label: '22K', value: '22k' },
  { label: '20K', value: '20k' },
  { label: '18K', value: '18k' },
];

export default function NewLoanScreen() {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [netWeight, setNetWeight] = useState('');
  const [purity, setPurity] = useState('22k');
  const [principal, setPrincipal] = useState('');
  const [goldRates, setGoldRates] = useState<GoldRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    const { data } = await supabase
      .from('gold_rates')
      .select('*')
      .order('purity');
    if (data) setGoldRates(data as GoldRate[]);
    setLoadingRates(false);
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const currentRate = goldRates.find((r) => r.purity === purity);
  const ratePerGram = currentRate ? Number(currentRate.rate_per_gram) : 0;

  // LTV = (Principal / (Net Weight * Rate per Gram)) * 100
  const netWeightNum = parseFloat(netWeight) || 0;
  const principalNum = parseFloat(principal) || 0;
  const goldValue = netWeightNum * ratePerGram;
  const ltvPercentage =
    goldValue > 0 ? (principalNum / goldValue) * 100 : 0;
  const ltvColor =
    ltvPercentage > 90
      ? Colors.danger
      : ltvPercentage > 75
        ? Colors.warning
        : Colors.success;

  const ltvWarning =
    ltvPercentage > 90
      ? 'Critical: LTV exceeds 90% — high risk!'
      : ltvPercentage > 75
        ? 'Caution: LTV above 75%'
        : ltvPercentage > 0
          ? 'Safe: LTV within acceptable range'
          : '';

  const validate = (): string | null => {
    if (!customerName.trim()) return 'Customer name is required';
    if (!/^\d{10}$/.test(phone.trim()))
      return 'Phone number must be 10 digits';
    if (!grossWeight || parseFloat(grossWeight) <= 0)
      return 'Gross weight is required';
    if (!netWeight || parseFloat(netWeight) <= 0)
      return 'Net weight is required';
    if (parseFloat(netWeight) > parseFloat(grossWeight))
      return 'Net weight cannot exceed gross weight';
    if (!principal || parseFloat(principal) <= 0)
      return 'Principal amount is required';
    if (ltvPercentage > 100) return 'Principal exceeds gold value (LTV > 100%)';
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);

    const { data, error: insertError } = await supabase
      .from('loans')
      .insert({
        customer_name: customerName.trim(),
        phone: phone.trim(),
        gross_weight: parseFloat(grossWeight),
        net_weight: parseFloat(netWeight),
        purity,
        principal: parseFloat(principal),
        ltv_percentage: Math.round(ltvPercentage * 100) / 100,
        status: 'active',
      })
      .select()
      .maybeSingle();

    setSaving(false);

    if (insertError || !data) {
      setError('Failed to save loan. Please try again.');
      return;
    }

    setSuccessId(data.id);
  };

  const handleReset = () => {
    setCustomerName('');
    setPhone('');
    setGrossWeight('');
    setNetWeight('');
    setPurity('22k');
    setPrincipal('');
    setError(null);
    setSuccessId(null);
  };

  if (successId) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.successContainer}>
          <LinearGradient
            colors={[Colors.emerald[800], Colors.emerald[900]]}
            style={styles.successCard}
          >
            <View style={styles.successIconWrapper}>
              <CheckCircle2
                size={48}
                color={Colors.emerald[300]}
                strokeWidth={2}
              />
            </View>
            <Text style={styles.successTitle}>Loan Created!</Text>
            <Text style={styles.successSubtitle}>
              The loan has been recorded successfully.
            </Text>

            <View style={styles.successSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <Text style={styles.summaryValue}>{customerName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Principal</Text>
                <Text style={styles.summaryValue}>
                  {formatINR(parseFloat(principal))}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>LTV</Text>
                <Text style={[styles.summaryValue, { color: ltvColor }]}>
                  {ltvPercentage.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.successActions}>
              <Button
                label="Create Receipt"
                variant="gold"
                onPress={() =>
                  router.navigate({
                    pathname: '/receipt',
                    params: { loanId: successId },
                  })
                }
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <Button
                label="New Loan"
                variant="ghost"
                onPress={handleReset}
                style={{ flex: 1, marginLeft: Spacing.sm }}
              />
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.screenTitle}>Create New Loan</Text>
          <Text style={styles.screenSubtitle}>
            Enter customer and gold details below
          </Text>

          {loadingRates ? (
            <ActivityIndicator
              size="small"
              color={Colors.gold[400]}
              style={styles.loader}
            />
          ) : (
            <View style={styles.rateBanner}>
              <Text style={styles.rateBannerText}>
                {purity.toUpperCase()} Rate: {formatINR(ratePerGram)}/g
              </Text>
            </View>
          )}

          <View style={styles.formCard}>
            <FormField
              label="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. Rajesh Kumar"
            />

            <FormField
              label="Phone Number"
              value={phone}
              onChangeText={(t) =>
                setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))
              }
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
            />

            <View style={styles.row}>
              <FormField
                label="Gross Weight"
                value={grossWeight}
                onChangeText={setGrossWeight}
                placeholder="0.00"
                keyboardType="decimal-pad"
                suffix="g"
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <FormField
                label="Net Weight"
                value={netWeight}
                onChangeText={setNetWeight}
                placeholder="0.00"
                keyboardType="decimal-pad"
                suffix="g"
                style={{ flex: 1, marginLeft: Spacing.sm }}
              />
            </View>

            <DropdownField
              label="Purity"
              value={purity}
              options={PURITY_OPTIONS}
              onSelect={setPurity}
            />

            <FormField
              label="Principal Cash Lent"
              value={principal}
              onChangeText={setPrincipal}
              placeholder="0"
              keyboardType="numeric"
              suffix="INR"
            />
          </View>

          {/* LTV Display */}
          <LinearGradient
            colors={[Colors.emerald[800], Colors.emerald[850]]}
            style={styles.ltvCard}
          >
            <View style={styles.ltvHeader}>
              <Calculator size={18} color={Colors.gold[400]} strokeWidth={2} />
              <Text style={styles.ltvTitle}>Loan-to-Value (LTV)</Text>
            </View>

            <View style={styles.ltvBody}>
              <View style={styles.ltvMainRow}>
                <Text style={styles.ltvLabel}>LTV Percentage</Text>
                <Text style={[styles.ltvValue, { color: ltvColor }]}>
                  {ltvPercentage.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.ltvDetailRow}>
                <Text style={styles.ltvDetailLabel}>Gold Value</Text>
                <Text style={styles.ltvDetailValue}>
                  {formatINR(goldValue)}
                </Text>
              </View>
              <View style={styles.ltvDetailRow}>
                <Text style={styles.ltvDetailLabel}>Principal</Text>
                <Text style={styles.ltvDetailValue}>
                  {formatINR(principalNum)}
                </Text>
              </View>
            </View>

            {ltvWarning ? (
              <View
                style={[
                  styles.ltvWarningBar,
                  { backgroundColor: `${ltvColor}15` },
                ]}
              >
                <AlertCircle size={14} color={ltvColor} strokeWidth={2} />
                <Text style={[styles.ltvWarningText, { color: ltvColor }]}>
                  {ltvWarning}
                </Text>
              </View>
            ) : null}
          </LinearGradient>

          {error && (
            <View style={styles.errorBar}>
              <AlertCircle size={16} color={Colors.danger} strokeWidth={2} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            label={saving ? 'Saving...' : 'Create Loan'}
            variant="gold"
            onPress={handleSave}
            disabled={saving || loadingRates}
            style={{ marginTop: Spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
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
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  loader: {
    marginTop: Spacing.lg,
  },
  rateBanner: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: Colors.gold[600],
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  rateBannerText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.gold[400],
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
  },
  ltvCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.emerald[600],
    overflow: 'hidden',
  },
  ltvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.emerald[700],
  },
  ltvTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.gold[400],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ltvBody: {
    padding: Spacing.xl,
  },
  ltvMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ltvLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  ltvValue: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xxxl,
  },
  ltvDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  ltvDetailLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  ltvDetailValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  ltvWarningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  ltvWarningText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.xs,
  },
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(192, 57, 43, 0.12)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  errorText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.sm,
    color: Colors.danger,
    flex: 1,
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  successCard: {
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.emerald[600],
    ...Shadows.large,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(45, 140, 106, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  successSummary: {
    width: '100%',
    backgroundColor: 'rgba(10, 31, 23, 0.5)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  summaryValue: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  successActions: {
    flexDirection: 'row',
    width: '100%',
  },
});
