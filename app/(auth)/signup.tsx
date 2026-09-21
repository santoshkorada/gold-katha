import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius, Shadows } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Phone, User, Calendar, Users, Store, MapPin } from 'lucide-react-native';

export default function SignupScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithMobile() {
    if (!mobileNumber || mobileNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }
    if (!name || !age || !gender || !shopName || !shopLocation) {
      Alert.alert('Error', 'Please fill in all details');
      return;
    }

    setLoading(true);
    const fakeEmail = `${mobileNumber}@goldkatha.app`;
    
    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password: mobileNumber,
      options: {
        data: {
          mobile_number: mobileNumber,
          name: name,
          age: parseInt(age),
          gender: gender,
          shop_name: shopName,
          shop_location: shopLocation,
        }
      }
    });

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else {
      // Auto login after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: mobileNumber,
      });
      if (!signInError) {
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          'Signup Successful',
          `However, login failed: ${signInError.message}. \n\nNote: If you have "Confirm email" enabled in your Supabase project settings, you must disable it since we are using fake emails for mobile numbers.`
        );
      }
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

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Coins size={28} color={Colors.gold[400]} strokeWidth={2} />
              </View>
            </View>
            <Text style={styles.brand}>GoldKatha</Text>
            <Text style={styles.tagline}>Start managing your gold loans</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>Join as a shop owner</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={Colors.gold[500]} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.neutral[400]}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop Name</Text>
              <View style={styles.inputWrapper}>
                <Store size={18} color={Colors.gold[500]} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your shop name"
                  placeholderTextColor={Colors.neutral[400]}
                  value={shopName}
                  onChangeText={setShopName}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop Location</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={18} color={Colors.gold[500]} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your city/area"
                  placeholderTextColor={Colors.neutral[400]}
                  value={shopLocation}
                  onChangeText={setShopLocation}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color={Colors.gold[500]} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor={Colors.neutral[400]}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Age</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar size={16} color={Colors.gold[500]} strokeWidth={2} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 30"
                      placeholderTextColor={Colors.neutral[400]}
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.inputWrapper}>
                    <Users size={16} color={Colors.gold[500]} strokeWidth={2} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="M / F / Other"
                      placeholderTextColor={Colors.neutral[400]}
                      value={gender}
                      onChangeText={setGender}
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={signUpWithMobile}
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
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    zIndex: 10,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: Colors.gold[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Shadows.gold,
  },
  logoInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 32,
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
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: Colors.gold[300],
    marginBottom: 6,
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
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
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
    marginTop: 28,
    marginBottom: 20,
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
});
