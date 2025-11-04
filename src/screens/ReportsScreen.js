import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dashboardService } from "../services/dashboardService";
import { Card } from "../components/Card";
import { Loading } from "../components/Loading";
import { theme } from "../theme";
import { Ionicons } from "@expo/vector-icons";

const ReportsScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await dashboardService.getPersonalStats();
      setStats(data);
    } catch (error) {
      console.error("Load reports error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  if (loading) {
    return <Loading />;
  }

  const personalStats = stats?.personalStats || {};

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
          />
        }
      >
        <Card>
          <View style={styles.header}>
            <Ionicons
              name="stats-chart"
              size={32}
              color={theme.colors.primary}
            />
            <Text style={styles.title}>Báo cáo cá nhân</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Tổng quan</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Tổng đơn hàng</Text>
            <Text style={styles.statValue}>
              {personalStats.totalOrders || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Tổng doanh thu</Text>
            <Text style={styles.statValue}>
              {(personalStats.totalRevenue || 0).toLocaleString("vi-VN")} đ
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Giá trị trung bình/đơn</Text>
            <Text style={styles.statValue}>
              {(personalStats.averageOrderValue || 0).toLocaleString("vi-VN")} đ
            </Text>
          </View>
        </Card>

        {stats?.ordersByStatus && (
          <Card>
            <Text style={styles.cardTitle}>Đơn hàng theo trạng thái</Text>
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <View key={status} style={styles.statusRow}>
                <Text style={styles.statusLabel}>{status}</Text>
                <Text style={styles.statusCount}>{count || 0}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textTransform: "capitalize",
  },
  statusCount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
});

export default ReportsScreen;
