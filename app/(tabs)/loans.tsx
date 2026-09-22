import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Search, ScrollText, ChevronRight, X } from 'lucide-react-native';
import { Colors, FontSizes, Spacing, Radius } from '@/lib/theme';
import { supabase, Loan } from '@/lib/supabase';
import { formatINR, formatDate } from '@/lib/format';

const RECENT_LIMIT = 5;

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecent = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT);

    if (fetchError) {
      setError('Could not load loans. Pull to retry.');
      setLoans([]);
    } else {
      setError(null);
      setLoans((data as Loan[]) || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fetchByPhone = useCallback(async (phone: string) => {
    const { data, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Could not search loans. Try again.');
      setLoans([]);
    } else {
      setError(null);
      setLoans((data as Loan[]) || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      if (activeSearch) {
        fetchByPhone(activeSearch);
      } else {
        fetchRecent();
      }
    }, [activeSearch, fetchByPhone, fetchRecent])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeSearch) {
      fetchByPhone(activeSearch);
    } else {
      fetchRecent();
    }
  }, [activeSearch, fetchByPhone, fetchRecent]);

  const handleSearch = () => {
    const phone = phoneQuery.replace(/[^0-9]/g, '');
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a 10-digit mobile number');
      return;
    }
    setError(null);
    setActiveSearch(phone);
    setPhoneQuery(phone);
    setLoading(true);
    fetchByPhone(phone);
  };

  const handleClearSearch = () => {
    setPhoneQuery('');
    setActiveSearch(null);
    setError(null);
    setLoading(true);
    fetchRecent();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerIconWrapper}>
          <ScrollText size={24} color={Colors.gold[400]} strokeWidth={2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.screenTitle}>Loans</Text>
          <Text style={styles.screenSubtitle}>
            {activeSearch
              ? `Results for +91 ${activeSearch}`
              : 'Latest 5 loans'}
          </Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Search size={16} color={Colors.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={phoneQuery}
            onChangeText={(t) =>
              setPhoneQuery(t.replace(/[^0-9]/g, '').slice(0, 10))
            }
            placeholder="Search by mobile number"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {phoneQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={8}>
              <X size={16} color={Colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.7}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold[400]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.gold[400]}
            style={styles.loader}
          />
        ) : loans.length === 0 ? (
          <View style={styles.emptyState}>
            <ScrollText
              size={40}
              color={Colors.neutral[500]}
              strokeWidth={1.5}
            />
            <Text style={styles.emptyStateTitle}>
              {activeSearch ? 'No loans found' : 'No loans yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeSearch
                ? 'No loans were created for this mobile number.'
                : 'Create a loan from the New Loan tab.'}
            </Text>
          </View>
        ) : (
          loans.map((loan) => (
            <TouchableOpacity
              key={loan.id}
              style={styles.loanCard}
              onPress={() => router.push(`/loan/${loan.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.thumbnailContainer}>
                {loan.item_image_url ? (
                  <Image source={{ uri: loan.item_image_url }} style={styles.thumbnailImage} />
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <Text style={styles.thumbnailPlaceholderText}>N/A</Text>
                  </View>
                )}
              </View>
              <View style={styles.loanCardBody}>
                <Text style={styles.loanName}>{loan.customer_name}</Text>
                <Text style={styles.loanMeta}>+91 {loan.phone}</Text>
                <Text style={styles.loanMeta}>
                  {formatDate(loan.created_at)} • {loan.purity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.loanCardRight}>
                <Text style={styles.loanAmount}>
                  {formatINR(Number(loan.principal))}
                </Text>
                <Text
                  style={[
                    styles.loanStatus,
                    loan.status === 'closed' && styles.loanStatusClosed,
                  ]}
                >
                  {loan.status}
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          ))
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  searchButton: {
    backgroundColor: Colors.gold[400],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: FontSizes.sm,
    color: Colors.surface,
  },
  errorText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.xs,
    color: Colors.danger,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyStateTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptyStateText: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  thumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  loanCardBody: {
    flex: 1,
  },
  loanName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  loanMeta: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  loanCardRight: {
    alignItems: 'flex-end',
  },
  loanAmount: {
    fontFamily: 'Manrope-Bold',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  loanStatus: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.xs,
    color: Colors.primary,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  loanStatusClosed: {
    color: Colors.textMuted,
  },
});
