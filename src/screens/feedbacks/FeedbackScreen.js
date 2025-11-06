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
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { feedbackService } from "../../services/feedbackService";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Loading } from "../../components/Loading";
import { StatusBadge } from "../../components/StatusBadge";
import { theme } from "../../theme";

const FeedbackScreen = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const data = await feedbackService.getAllFeedbacks();
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setFeedbacks(sorted);
    } catch (error) {
      console.error("Load feedbacks error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeedbacks();
  };

  const renderFeedback = ({ item }) => {
    const scaleAnim = new Animated.Value(1);
    const handlePressIn = () =>
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    const handlePressOut = () =>
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    const customer = item.customer;
    const dealer = item.dealer;
    const createdBy = item.createdBy;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Card style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>
                  {customer?.fullName || "Không rõ khách hàng"}
                </Text>
                <Text style={styles.customerPhone}>{customer?.phone}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.feedbackDetails}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={theme.colors.accent}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.detailLabel}>Đại lý:</Text>
                <Text style={styles.detailValue}>{dealer?.name || "N/A"}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={theme.colors.info}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.detailLabel}>Nhân viên:</Text>
                <Text style={styles.detailValue}>
                  {createdBy?.profile?.name || createdBy?.email || "N/A"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.detailLabel}>Ngày:</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(item.createdAt), "dd/MM/yyyy")}
                </Text>
              </View>

              <View style={[styles.detailRow, { alignItems: "flex-start" }]}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={16}
                  color={theme.colors.success}
                  style={{ marginRight: 6, marginTop: 3 }}
                />
                <Text style={styles.detailLabel}>Nội dung:</Text>
                <Text style={[styles.detailValue, { flex: 1 }]}>
                  {item.content}
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Phản hồi khách hàng</Text>

        <Button
          title="Tạo phản hồi"
          variant="primary"
          size="md"
          onPress={() => navigation.navigate("CreateFeedback")}
        />
      </View>

      {/* Danh sách feedback */}
      <FlatList
        data={feedbacks}
        renderItem={renderFeedback}
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
              name="chatbubbles-outline"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.emptyText}>Chưa có phản hồi nào</Text>
            <Button
              title="Gửi phản hồi đầu tiên"
              variant="outline"
              size="md"
              onPress={() => navigation.navigate("CreateFeedback")}
              style={styles.emptyButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  listContent: { padding: theme.spacing.lg },
  feedbackCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  customerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  customerPhone: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  feedbackDetails: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    flexShrink: 1,
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
  emptyButton: { marginTop: theme.spacing.md },
});

export default FeedbackScreen;
