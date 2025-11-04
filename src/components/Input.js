import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { theme } from "../theme";

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  style,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  editable,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          Boolean(multiline) && styles.inputMultiline,
          style,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        secureTextEntry={Boolean(secureTextEntry)}
        keyboardType={keyboardType || "default"}
        multiline={Boolean(multiline)}
        numberOfLines={Number(numberOfLines) || 1}
        {...(autoCapitalize && { autoCapitalize })}
        {...(autoComplete && { autoComplete })}
        {...(autoCorrect !== undefined && {
          autoCorrect: Boolean(autoCorrect),
        })}
        {...(editable !== undefined && { editable: Boolean(editable) })}
        {...(returnKeyType && { returnKeyType })}
        {...(onSubmitEditing && { onSubmitEditing })}
        {...(blurOnSubmit !== undefined && {
          blurOnSubmit: Boolean(blurOnSubmit),
        })}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputMultiline: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
