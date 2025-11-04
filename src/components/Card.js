import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../theme";

export const Card = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.md,
    marginBottom: theme.spacing.md,
  },
});
