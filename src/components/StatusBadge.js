import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export const StatusBadge = ({ status, style }) => {
  const getStatusConfig = (status) => {
    const configs = {
      draft: { color: theme.colors.statusDraft, label: 'Nháp' },
      sent: { color: theme.colors.statusPending, label: 'Đã gửi' },
      accepted: { color: theme.colors.statusConfirmed, label: 'Đã chấp nhận' },
      rejected: { color: theme.colors.statusRejected, label: 'Từ chối' },
      converted: { color: theme.colors.statusCompleted, label: 'Đã chuyển' },
      new: { color: theme.colors.statusPending, label: 'Mới' },
      confirmed: { color: theme.colors.statusConfirmed, label: 'Đã xác nhận' },
      allocated: { color: theme.colors.statusConfirmed, label: 'Đã phân bổ' },
      invoiced: { color: theme.colors.info, label: 'Đã xuất hóa đơn' },
      delivered: { color: theme.colors.statusCompleted, label: 'Đã giao' },
      cancelled: { color: theme.colors.statusCancelled, label: 'Đã hủy' },
      pending: { color: theme.colors.statusPending, label: 'Chờ xử lý' },
      in_progress: { color: theme.colors.info, label: 'Đang giao' },
      completed: { color: theme.colors.statusCompleted, label: 'Hoàn tất' },
    };
    return configs[status] || { color: theme.colors.textSecondary, label: status };
  };

  const config = getStatusConfig(status);

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20' }, style]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

