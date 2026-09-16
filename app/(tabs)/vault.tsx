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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Vault,
  Search,
  Package,
  Lock,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react-native';
import { Colors, FontSizes, Spacing, Radius, Shadows } from '@/lib/theme';
import { supabase, Loan } from '@/lib/supabase';
import { formatINR, formatDate } from '@/lib/format';
import { Button } from '@/components/Form';

export default function VaultScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>(
    'all'
  );
  const [assignModal, setAssignModal] = useState<Loan | null>(null);
  const [lockerInput, setLockerInput] = useState('');
  const [bagInput, setBagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    const { data } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (data) setLoans(data as Loan[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLoans();
  }, [fetchLoans]);

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      !search ||
      loan.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      loan.phone.includes(search);

    const hasAssignment = loan.locker_number && loan.bag_number;
    const matchesFilter =
      filter === 'all' ||
      (filter === 'assigned' && hasAssignment) ||
      (filter === 'unassigned' && !hasAssignment);

    return matchesSearch && matchesFilter;
  });

  const assignedCount = loans.filter(
    (l) => l.locker_number && l.bag_number
  ).length;
  const unassignedCount = loans.length - assignedCount;

  const openAssignModal = (loan: Loan) => {
    setAssignModal(loan);
    setLockerInput(loan.locker_number || '');
    setBagInput(loan.bag_number || '');
    setError(null);
  };

  const closeAssignModal = () => {
    setAssignModal(null);
    setLockerInput('');
    setBagInput('');
    setError(null);
  };

  const handleAssign = async () => {
    if (!assignModal) return;
    if (!lockerInput.trim() || !bagInput.trim()) {
      setError('Both locker and bag numbers are required');
      return;
    }
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('loans')
      .update({
        locker_number: lockerInput.trim().toUpperCase(),
        bag_number: bagInput.trim().toUpperCase(),
      })
      .eq('id', assignModal.id);

    setSaving(false);

    if (updateError) {
      setError('Failed to assign. Try again.');
      return;
    }

    setLoans((prev) =>
      prev.map((l) =>
        l.id === assignModal.id
          ? {
              ...l,
              locker_number: lockerInput.trim().toUpperCase(),
              bag_number: bagInput.trim().toUpperCase(),
            }
          : l
      )
    );
    closeAssignModal();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerIconWrapper}>
          <Vault size={24} color={Colors.gold[400]} strokeWidth={2} />
        </View>
        <View>
          <Text style={styles.screenTitle}>Vault Inventory</Text>
          <Text style={styles.screenSubtitle}>
            Locker & bag assignments
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{assignedCount}</Text>
          <Text style={styles.statLabel}>Assigned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.warning }]}>
            {unassignedCount}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{loans.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'assigned', 'unassigned'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              filter === f && styles.filterChipActive,
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === f && styles.filterChipTextActive,
              ]}
            >
              {f === 'all' ? 'All' : f === 'assigned' ? 'Assigned' : 'Pending'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.gold[400]}
            style={styles.loader}
          />
        ) : filteredLoans.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={40} color={Colors.neutral[500]} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>No items found</Text>
            <Text style={styles.emptyStateText}>
              {loans.length === 0
                ? 'Create a loan first, then assign vault locations here.'
                : 'No loans match your current filter.'}
            </Text>
          </View>
        ) : (
          filteredLoans.map((loan) => {
            const assigned = loan.locker_number && loan.bag_number;
            return (
              <View key={loan.id} style={styles.vaultItem}>
                <View style={styles.vaultItemLeft}>
                  <View
                    style={[
                      styles.vaultIconWrapper,
                      assigned
                        ? styles.vaultIconAssigned
                        : styles.vaultIconPending,
                    ]}
                  >
                    {assigned ? (
                      <Lock size={18} color={Colors.emerald[300]} strokeWidth={2} />
                    ) : (
                      <Package size={18} color={Colors.warning} strokeWidth={2} />
                    )}
                  </View>
                  <View style={styles.vaultItemInfo}>
                    <Text style={styles.vaultCustomerName}>
                      {loan.customer_name}
                    </Text>
                    <Text style={styles.vaultMeta}>
                      {loan.purity.toUpperCase()} • {Number(loan.net_weight).toFixed(2)}g • {formatINR(Number(loan.principal))}
                    </Text>
                    {assigned ? (
                      <View style={styles.assignmentRow}>
                        <View style={styles.assignmentBadge}>
                          <Text style={styles.assignmentBadgeLabel}>L</Text>
                          <Text style={styles.assignmentBadgeValue}>
                            {loan.locker_number}
                          </Text>
                        </View>
                        <View style={styles.assignmentBadge}>
                          <Text style={styles.assignmentBadgeLabel}>B</Text>
                          <Text style={styles.assignmentBadgeValue}>
                            {loan.bag_number}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.unassignedText}>
                        Not assigned to vault
                      </Text>
                    )}
                    <Text style={styles.vaultDate}>
                      {formatDate(loan.created_at)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.assignButton,
                    assigned && styles.assignButtonEdit,
                  ]}
                  onPress={() => openAssignModal(loan)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.assignButtonText,
                      assigned && styles.assignButtonTextEdit,
                    ]}
                  >
                    {assigned ? 'Edit' : 'Assign'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Assignment Modal */}
      <Modal
        visible={assignModal !== null}
        transparent
        animationType="fade"
        onRequestClose={closeAssignModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign Vault Location</Text>
                <Text style={styles.modalSubtitle}>
                  {assignModal?.customer_name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeAssignModal}
                style={styles.modalCloseBtn}
                activeOpacity={0.6}
              >
                <X size={20} color={Colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputRow}>
              <View
                style={[
                  styles.modalInputWrapper,
                  { flex: 1, marginRight: Spacing.sm },
                ]}
              >
                <Text style={styles.modalInputLabel}>Locker Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={lockerInput}
                  onChangeText={setLockerInput}
                  placeholder="e.g. L-12"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>
              <View
                style={[
                  styles.modalInputWrapper,
                  { flex: 1, marginLeft: Spacing.sm },
                ]}
              >
                <Text style={styles.modalInputLabel}>Bag Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={bagInput}
                  onChangeText={setBagInput}
                  placeholder="e.g. B-07"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {error && (
              <Text style={styles.modalErrorText}>{error}</Text>
            )}

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={closeAssignModal}
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <Button
                label={saving ? 'Saving...' : 'Confirm'}
                variant="gold"
                onPress={handleAssign}
                disabled={saving}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.lg,
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: FontSizes.xl,
    color: Colors.emerald[300],
  },
  statLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: Colors.gold[600],
  },
  filterChipText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.gold[400],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  loader: {
    marginTop: Spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
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
  vaultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  vaultItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  vaultIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultIconAssigned: {
    backgroundColor: 'rgba(45, 140, 106, 0.15)',
    borderWidth: 1,
    borderColor: Colors.emerald[600],
  },
  vaultIconPending: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: Colors.gold[600],
  },
  vaultItemInfo: {
    flex: 1,
  },
  vaultCustomerName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  vaultMeta: {
    fontFamily: 'Manrope-Regular',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 3,
  },
  assignmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  assignmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(45, 140, 106, 0.12)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  assignmentBadgeLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 10,
    color: Colors.emerald[400],
  },
  assignmentBadgeValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: Colors.emerald[300],
  },
  unassignedText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.xs,
    color: Colors.warning,
    marginTop: Spacing.sm,
  },
  vaultDate: {
    fontFamily: 'Manrope-Regular',
    fontSize: 10,
    color: Colors.neutral[500],
    marginTop: 4,
  },
  assignButton: {
    backgroundColor: Colors.gold[400],
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  assignButtonEdit: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.neutral[600],
  },
  assignButtonText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.emerald[900],
  },
  assignButtonTextEdit: {
    color: Colors.textSecondary,
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
  modalInputRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  modalInputWrapper: {},
  modalInputLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[600],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontFamily: 'Manrope-SemiBold',
  },
  modalErrorText: {
    fontFamily: 'Manrope-Medium',
    fontSize: FontSizes.sm,
    color: Colors.danger,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
});
