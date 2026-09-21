import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius, Shadows } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Phone, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react-native';

export default function LoginScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  async function signInWithMobile() {
    setErrorMessage(null);
    if (!mobileNumber || mobileNumber.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    const phone = `+91${mobileNumber.replace(/[^0-9]/g, '')}`;
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setOtpSent(true);
    }
    setLoading(false);
  }

  async function verifyOtp() {
    setErrorMessage(null);
    if (!otpCode || otpCode.length < 6) {
      setErrorMessage('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    const phone = `+91${mobileNumber.replace(/[^0-9]/g, '')}`;

    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otpCode,
      type: 'sms', // Note: Supabase uses 'sms' as the type for phone auth, even when channel is whatsapp
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={[Colors.emerald[900], Colors.neutral[950]]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top decorative accent */}
      <View style={styles.accentBar} />

      <View style={styles.content}>
        {/* Logo / Brand */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoInner}>
              <Coins size={32} color={Colors.gold[400]} strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.brand}>GoldKatha</Text>
          <Text style={styles.tagline}>Secure Gold Loan Management</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {errorMessage ? (
            <View style={styles.errorBar}>
              <AlertCircle size={16} color={Colors.danger} strokeWidth={2} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {!otpSent ? (
            <>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>Sign in to your account</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color={Colors.gold[500]} strokeWidth={2} style={styles.inputIcon} />
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor={Colors.neutral[400]}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    editable={!loading}
                    maxLength={10}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={signInWithMobile}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.gold[500], Colors.gold[700]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send SMS OTP</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setOtpSent(false)}
                disabled={loading}
              >
                <ArrowLeft size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              
              <Text style={styles.cardTitle}>Enter OTP</Text>
              <Text style={styles.cardSubtitle}>We sent an SMS code to +91 {mobileNumber}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <View style={styles.inputWrapper}>
                  <KeyRound size={18} color={Colors.gold[500]} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor={Colors.neutral[400]}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    editable={!loading}
                    maxLength={6}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={verifyOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.gold[500], Colors.gold[700]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Login</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={signInWithMobile}
                disabled={loading}
              >
                <Text style={styles.resendText}>Didn't receive it? Resend</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.gold[400],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: Colors.gold[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Shadows.gold,
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 36,
    color: Colors.gold[400],
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  cardTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: Colors.gold[300],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[600],
    paddingHorizontal: Spacing.lg,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 16,
  },
  countryCode: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  button: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...Shadows.gold,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Manrope-Bold',
    color: '#fff',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontFamily: 'Manrope-Medium',
    color: Colors.textMuted,
    fontSize: 14,
  },
  link: {
    fontFamily: 'Manrope-Bold',
    color: Colors.gold[400],
    fontSize: 14,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.xl,
    zIndex: 10,
    padding: Spacing.sm,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resendText: {
    fontFamily: 'Manrope-SemiBold',
    color: Colors.gold[400],
    fontSize: 14,
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
    marginBottom: Spacing.xl,
  },
  errorText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: Colors.danger,
    flex: 1,
  },
});
