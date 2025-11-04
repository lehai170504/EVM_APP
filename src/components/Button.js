import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { theme } from "../theme";

export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      styles[`button_${variant}`],
      styles[`button_${size}`],
      Boolean(fullWidth) && styles.fullWidth,
      Boolean(disabled) && styles.buttonDisabled,
      style,
    ];
    return baseStyle;
  };

  const getTextStyle = () => {
    return [
      styles.text,
      styles[`text_${variant}`],
      styles[`text_${size}`],
      textStyle,
    ];
  };

  // Ensure disabled and loading are proper booleans
  const isDisabled = Boolean(disabled) || Boolean(loading);
  const isLoading = Boolean(loading);

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? theme.colors.textWhite
              : theme.colors.primary
          }
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.sm,
  },
  button_primary: {
    backgroundColor: theme.colors.primary,
  },
  button_secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  button_outline: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button_success: {
    backgroundColor: theme.colors.success,
  },
  button_danger: {
    backgroundColor: theme.colors.error,
  },
  button_sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  button_md: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  button_lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily.medium,
  },
  text_primary: {
    color: theme.colors.textWhite,
  },
  text_secondary: {
    color: theme.colors.primary,
  },
  text_outline: {
    color: theme.colors.textPrimary,
  },
  text_success: {
    color: theme.colors.textWhite,
  },
  text_danger: {
    color: theme.colors.textWhite,
  },
  text_sm: {
    fontSize: theme.typography.fontSize.sm,
  },
  text_md: {
    fontSize: theme.typography.fontSize.base,
  },
  text_lg: {
    fontSize: theme.typography.fontSize.lg,
  },
});
