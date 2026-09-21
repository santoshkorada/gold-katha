import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Colors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [backfilled, setBackfilled] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'Manrope-ExtraBold': Manrope_800ExtraBold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthInitialized(true);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (!authInitialized || (!fontsLoaded && !fontError)) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      // Redirect to home if logged in and on auth screen
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // Redirect to login if not logged in and not on auth screen
      router.replace('/(auth)/login');
    }
  }, [session, authInitialized, segments, fontsLoaded, fontError]);

  useEffect(() => {
    const backfillOrphanedLoans = async () => {
      if (session && !backfilled) {
        await supabase.rpc('assign_orphaned_loans_to_current_tenant');
        setBackfilled(true);
      }
    };
    backfillOrphanedLoans();
  }, [session, backfilled]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Prevent rendering until auth is initialized to avoid flickering
  if (!authInitialized) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="loan/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
