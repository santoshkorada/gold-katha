import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ReactNode } from 'react';
import { Colors, FontSizes, Radius, Spacing } from '@/lib/theme';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'decimal-pad';
  suffix?: string;
  error?: string | null;
  style?: ViewStyle;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  suffix,
  error,
  style,
}: FormFieldProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, suffix && styles.inputWithSuffix]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {suffix && (
          <View style={styles.suffixContainer}>
            <Text style={styles.suffixText}>{suffix}</Text>
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

type DropdownFieldProps = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  error?: string | null;
  style?: ViewStyle;
};

export function DropdownField({
  label,
  value,
  options,
  onSelect,
  error,
  style,
}: DropdownFieldProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dropdownRow}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <View
              key={option.value}
              style={[
                styles.dropdownOption,
                selected && styles.dropdownOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.dropdownOptionText,
                  selected && styles.dropdownOptionTextSelected,
                ]}
                onPress={() => onSelect(option.value)}
              >
                {option.label}
              </Text>
            </View>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'success' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = styles[`btn_${variant}`] || styles.btn_primary;
  const variantTextStyle =
    styles[`btnText_${variant}`] || styles.btnText_primary;

  return (
    <View
      style={[
        styles.btnBase,
        variantStyle,
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      <Text
        style={[styles.btnTextBase, variantTextStyle, textStyle]}
        onPress={disabled ? undefined : onPress}
      >
        {icon ? `${icon}  ` : ''}{label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[600],
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  inputWithSuffix: {
    paddingRight: Spacing.sm,
  },
  suffixContainer: {
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  suffixText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dropdownOption: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[600],
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    borderColor: Colors.gold[400],
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  dropdownOptionText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dropdownOptionTextSelected: {
    color: Colors.gold[400],
  },
  btnBase: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_primary: {
    backgroundColor: Colors.emerald[600],
  },
  btn_gold: {
    backgroundColor: Colors.gold[400],
  },
  btn_success: {
    backgroundColor: Colors.emerald[500],
  },
  btn_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.neutral[600],
  },
  btn_danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnTextBase: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  btnText_primary: {
    color: Colors.textPrimary,
  },
  btnText_gold: {
    color: Colors.emerald[900],
  },
  btnText_success: {
    color: Colors.textPrimary,
  },
  btnText_ghost: {
    color: Colors.textSecondary,
  },
  btnText_danger: {
    color: Colors.danger,
  },
});
