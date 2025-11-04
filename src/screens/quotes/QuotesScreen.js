import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { quoteService } from "../../services/quoteService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";

const QuotesScreen = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const data = await quoteService.getQuotes();
      // 🔹 Sắp xếp báo giá mới nhất lên đầu
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setQuotes(sorted);
    } catch (error) {
      console.error("Load quotes error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuotes();
  };

  const renderQuote = ({ item }) => {
    const customerName =
      typeof item.customer === "object"
        ? item.customer?.fullName || item.customer?.name
        : "N/A";

    const scaleAnim = new Animated.Value(1);
    const handlePressIn = () =>
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    const handlePressOut = () =>
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("QuoteDetail", { quoteId: item._id })
        }
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Card style={styles.quoteCard}>
            <View style={styles.quoteHeader}>
              <View style={styles.quoteInfo}>
                <Text style={styles.customerName}>{customerName}</Text>
                <Text style={styles.quoteDate}>
                  {format(new Date(item.createdAt), "dd/MM/yyyy")}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.quoteDetails}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="cube-outline"
                  size={16}
                  color={theme.colors.accent}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.detailLabel}>Số lượng:</Text>
                <Text style={styles.detailValue}>
                  {item.items?.reduce((sum, i) => sum + (i.qty || 0), 0) || 0}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons
                  name="cash-outline"
                  size={16}
                  color={theme.colors.success}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.detailLabel}>Tổng tiền:</Text>
                <Text style={styles.totalValue}>
                  {item.total?.toLocaleString("vi-VN") ||
                    item.totalPrice?.toLocaleString("vi-VN") ||
                    0}{" "}
                  đ
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách báo giá</Text>
        <Button
          title="Tạo báo giá mới"
          variant="primary"
          size="md"
          onPress={() => navigation.navigate("CreateQuote")}
        />
      </View>

      {/* Danh sách */}
      <FlatList
        data={quotes}
        renderItem={renderQuote}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.emptyText}>Chưa có báo giá nào</Text>
            <Button
              title="Tạo báo giá đầu tiên"
              variant="outline"
              size="md"
              onPress={() => navigation.navigate("CreateQuote")}
              style={styles.emptyButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  quoteCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
  },
  quoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  quoteInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  quoteDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  quoteDetails: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing["5xl"],
  },
  emptyText: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  emptyButton: {
    marginTop: theme.spacing.md,
  },
});

export default QuotesScreen;
