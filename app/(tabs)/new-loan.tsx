import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CheckCircle2, AlertCircle, Calculator, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Colors, FontSizes, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, GoldRate } from '@/lib/supabase';
import { formatINR } from '@/lib/format';
import { FormField, DropdownField, Button } from '@/components/Form';
import {
  InterestType,
  interestDurationSuffix,
  interestPeriodLabel,
  totalInterest,
} from '@/lib/interest';
import DateTimePicker from '@react-native-community/datetimepicker';



const INTEREST_TYPE_OPTIONS = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Daily', value: 'daily' },
];

const KYC_TYPE_OPTIONS = [
  { label: 'Aadhar Card', value: 'aadhar' },
  { label: 'PAN Card', value: 'pan' },
  { label: 'Driving License', value: 'driving_license' },
];

export default function NewLoanScreen() {
  const [loanDate, setLoanDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [netWeight, setNetWeight] = useState('');
  const [purity, setPurity] = useState('22k');
  const [principal, setPrincipal] = useState('');
  const [interestType, setInterestType] = useState<InterestType>('monthly');
  const [interestPerHundred, setInterestPerHundred] = useState('');
  const [duration, setDuration] = useState('1');
  const [lockerNumber, setLockerNumber] = useState('');
  const [bagNumber, setBagNumber] = useState('');
  const [goldRates, setGoldRates] = useState<GoldRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [kycType, setKycType] = useState('aadhar');
  const [kycNumber, setKycNumber] = useState('');
  const [kycImageUri, setKycImageUri] = useState<string | null>(null);
  const [kycImageBase64, setKycImageBase64] = useState<string | null>(null);

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
  
  const purityOptions = goldRates.map(r => ({
    label: r.purity === 'custom' ? 'Custom' : r.purity.toUpperCase(),
    value: r.purity
  }));

  // LTV = (Principal / (Net Weight * Rate per Gram)) * 100
  const netWeightNum = parseFloat(netWeight) || 0;
  const principalNum = parseFloat(principal) || 0;
  const interestPerHundredNum = parseFloat(interestPerHundred) || 0;
  const durationNum = parseInt(duration, 10) || 0;
  const interestAmount = totalInterest(
    principalNum,
    interestPerHundredNum,
    durationNum
  );
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
    if (!interestPerHundred || parseFloat(interestPerHundred) <= 0)
      return 'Interest rate (₹ per ₹100) is required';
    if (!duration || parseInt(duration, 10) < 1)
      return 'Duration must be at least 1';
    if (ltvPercentage > 100) return 'Principal exceeds gold value (LTV > 100%)';
    return null;
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
        setError(null);
      }
    } catch (err: any) {
      setError('Failed to open camera: ' + err.message);
    }
  };

  const handleTakeKycPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setKycImageUri(result.assets[0].uri);
        setKycImageBase64(result.assets[0].base64 || null);
        setError(null);
      }
    } catch (err: any) {
      setError('Failed to open camera: ' + err.message);
    }
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);

    let imagePublicUrl = null;
    if (imageUri && imageBase64) {
      const fileName = `loan_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('loan_images')
        .upload(fileName, decode(imageBase64), {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        setError('Failed to upload image: ' + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase
        .storage
        .from('loan_images')
        .getPublicUrl(fileName);
      
      imagePublicUrl = publicUrlData.publicUrl;
    }

    let kycImagePublicUrl = null;
    if (kycImageUri && kycImageBase64) {
      const fileName = `kyc_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('loan_images')
        .upload(fileName, decode(kycImageBase64), {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        setError('Failed to upload KYC image: ' + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase
        .storage
        .from('loan_images')
        .getPublicUrl(fileName);
      
      kycImagePublicUrl = publicUrlData.publicUrl;
    }

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
        interest_type: interestType,
        interest_per_hundred: parseFloat(interestPerHundred),
        duration: parseInt(duration, 10),
        status: 'active',
        item_image_url: imagePublicUrl,
        locker_number: lockerNumber.trim() || null,
        bag_number: bagNumber.trim() || null,
        kyc_type: kycType,
        kyc_number: kycNumber.trim() || null,
        kyc_image_url: kycImagePublicUrl,
        created_at: loanDate.toISOString(),
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
    setLoanDate(new Date());
    setCustomerName('');
    setPhone('');
    setGrossWeight('');
    setNetWeight('');
    setPurity('22k');
    setPrincipal('');
    setInterestType('monthly');
    setInterestPerHundred('');
    setDuration('1');
    setLockerNumber('');
    setBagNumber('');
    setImageUri(null);
    setImageBase64(null);
    setKycType('aadhar');
    setKycNumber('');
    setKycImageUri(null);
    setKycImageBase64(null);
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
                <Text style={styles.summaryLabel}>Interest</Text>
                <Text style={styles.summaryValue}>
                  {formatINR(interestAmount)} / {duration}{' '}
                  {interestDurationSuffix(interestType, durationNum)}
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
                {purity === 'custom' ? 'Custom' : purity.toUpperCase()} Rate: {formatINR(ratePerGram)}/g
              </Text>
            </View>
          )}

          <View style={styles.formCard}>
            {Platform.OS === 'web' ? (
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.xs }}>Loan Date</Text>
                {React.createElement('input', {
                  type: 'date',
                  value: loanDate.toISOString().split('T')[0],
                  onChange: (e: any) => {
                    const d = new Date(e.target.value);
                    if (!isNaN(d.getTime())) setLoanDate(d);
                  },
                  style: {
                    backgroundColor: Colors.surfaceElevated,
                    color: Colors.textPrimary,
                    padding: '14px 16px',
                    borderRadius: Radius.md,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    fontFamily: 'Manrope-Medium',
                    fontSize: 16,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }
                })}
              </View>
            ) : (
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={styles.photoLabel}>Loan Date</Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: Radius.md,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 14,
                  }}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ fontFamily: 'Manrope-Medium', fontSize: FontSizes.md, color: Colors.textPrimary }}>
                    {loanDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={loanDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setLoanDate(selectedDate);
                    }}
                  />
                )}
              </View>
            )}

            <FormField
              label="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. Rajesh Kumar"
            />

            {/* Photo Capture Section */}
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>Gold Item Photo (Optional)</Text>
              {imageUri ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={handleTakePhoto}
                  >
                    <Text style={styles.retakeButtonText}>Retake Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoCaptureButton}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <View style={styles.photoCaptureIcon}>
                    <Camera size={24} color={Colors.gold[400]} />
                  </View>
                  <Text style={styles.photoCaptureText}>Tap to take a photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <FormField
              label="Phone Number"
              value={phone}
              onChangeText={(t) =>
                setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))
              }
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
            />

            {/* KYC Section */}
            <View style={{ marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
              <Text style={styles.sectionTitle}>Customer KYC</Text>
              
              <DropdownField
                label="ID Document Type"
                value={kycType}
                options={KYC_TYPE_OPTIONS}
                onSelect={setKycType}
              />

              <FormField
                label="Document Number"
                value={kycNumber}
                onChangeText={setKycNumber}
                placeholder="e.g. 1234 5678 9012"
              />

              <Text style={styles.photoLabel}>ID Document Photo (Optional)</Text>
              {kycImageUri ? (
                <View style={[styles.photoPreviewContainer, { marginBottom: Spacing.md }]}>
                  <Image source={{ uri: kycImageUri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={handleTakeKycPhoto}
                  >
                    <Text style={styles.retakeButtonText}>Retake Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.photoCaptureButton, { marginBottom: Spacing.md }]}
                  onPress={handleTakeKycPhoto}
                  activeOpacity={0.7}
                >
                  <View style={styles.photoCaptureIcon}>
                    <Camera size={24} color={Colors.gold[400]} />
                  </View>
                  <Text style={styles.photoCaptureText}>Tap to capture ID photo</Text>
                </TouchableOpacity>
              )}
            </View>

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
              options={purityOptions}
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

            <DropdownField
              label="Interest Type"
              value={interestType}
              options={INTEREST_TYPE_OPTIONS}
              onSelect={(value) => setInterestType(value as InterestType)}
            />

            <View style={styles.row}>
              <FormField
                label="Interest"
                value={interestPerHundred}
                onChangeText={setInterestPerHundred}
                placeholder="e.g. 2"
                keyboardType="decimal-pad"
                suffix="₹/₹100"
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <FormField
                label="Duration"
                value={duration}
                onChangeText={(t) =>
                  setDuration(t.replace(/[^0-9]/g, '').slice(0, 4))
                }
                placeholder="1"
                keyboardType="numeric"
                suffix={interestDurationSuffix(interestType, durationNum || 1)}
                style={{ flex: 1, marginLeft: Spacing.sm }}
              />
            </View>
            <Text style={styles.interestHint}>
              ₹{interestPerHundredNum || 0} interest on every ₹100 principal, per{' '}
              {interestPeriodLabel(interestType)}
            </Text>

            {/* Vault Assignment */}
            <View style={{ marginTop: Spacing.md }}>
              <Text style={styles.sectionTitle}>Vault Assignment (Optional)</Text>
              <View style={styles.row}>
                <FormField
                  label="Locker Number"
                  value={lockerNumber}
                  onChangeText={setLockerNumber}
                  placeholder="e.g. L-12"
                  style={{ flex: 1, marginRight: Spacing.sm }}
                />
                <FormField
                  label="Bag Number"
                  value={bagNumber}
                  onChangeText={setBagNumber}
                  placeholder="e.g. B-45"
                  style={{ flex: 1, marginLeft: Spacing.sm }}
                />
              </View>
            </View>
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
              <View style={styles.ltvDetailRow}>
                <Text style={styles.ltvDetailLabel}>
                  Interest ({durationNum || 0}{' '}
                  {interestDurationSuffix(interestType, durationNum || 1)})
                </Text>
                <Text style={styles.ltvDetailValue}>
                  {formatINR(interestAmount)}
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
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
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
  interestHint: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: -Spacing.md,
    marginBottom: Spacing.xs,
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
  photoSection: {
    marginBottom: Spacing.lg,
  },
  photoLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  photoCaptureButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  photoCaptureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  photoCaptureText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  photoPreviewContainer: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  retakeButton: {
    position: 'absolute',
    bottom: Spacing.md,
    backgroundColor: 'rgba(5, 10, 8, 0.75)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.gold[500],
  },
  retakeButtonText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.gold[400],
  },
});
