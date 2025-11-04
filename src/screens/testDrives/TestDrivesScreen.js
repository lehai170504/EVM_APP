import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { testDriveService } from "../../services/testDrivesService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { theme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const TestDrivesScreen = () => {
  const [testDrives, setTestDrives] = useState([]);
  const [filteredTestDrives, setFilteredTestDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    loadTestDrives();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = testDrives.filter(
        (t) =>
          t.customer?.fullName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          t.customer?.phone?.includes(searchQuery) ||
          t.dealer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTestDrives(filtered);
    } else {
      setFilteredTestDrives(testDrives);
    }
  }, [searchQuery, testDrives]);

  const loadTestDrives = async () => {
    try {
      const data = await testDriveService.getAll();
      setTestDrives(data);
      setFilteredTestDrives(data);
    } catch (error) {
      console.error("Load test drives error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTestDrives();
  };

  const renderTestDrive = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("TestDriveDetail", { testDriveId: item._id })
        }
      >
        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.infoContainer}>
              <Text style={styles.customerName}>
                {item.customer?.fullName || "Không rõ tên"}
              </Text>
              <Text style={styles.customerPhone}>{item.customer?.phone}</Text>
              <Text style={styles.dealerText}>
                Đại lý: {item.dealer?.name || "Không rõ"}
              </Text>
              <Text style={styles.variantText}>
                Phiên bản: {item.variant?.trim || "N/A"}
              </Text>
              <Text style={styles.timeText}>
                Thời gian:{" "}
                {new Date(item.preferredTime).toLocaleString("vi-VN")}
              </Text>
              <Text style={[styles.status, styles[`status_${item.status}`]]}>
                Trạng thái: {item.status}
              </Text>
              {item.result?.feedback && (
                <Text style={styles.feedback}>
                  💬 Phản hồi: {item.result.feedback}
                </Text>
              )}
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={theme.colors.textSecondary}
            />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Input
            placeholder="Tìm kiếm lịch lái thử..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
        {/* <Button
          title="Tạo lịch lái thử"
          variant="primary"
          size="md"
          onPress={() => navigation.navigate("CreateTestDrive")}
          style={styles.createButton}
        /> */}
      </View>

      <FlatList
        data={filteredTestDrives}
        renderItem={renderTestDrive}
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
              name="car-outline"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.emptyText}>Chưa có lịch lái thử nào</Text>
            <Button
              title="Tạo lịch lái thử đầu tiên"
              variant="outline"
              size="md"
              onPress={() => navigation.navigate("CreateTestDrive")}
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
  },
  searchContainer: {
    marginBottom: theme.spacing.md,
  },
  createButton: {
    marginBottom: 0,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  customerPhone: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  dealerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  variantText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  timeText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  feedback: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  status: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
  status_done: { color: "green" },
  status_confirmed: { color: "#007AFF" },
  status_requested: { color: "#FF9500" },
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

export default TestDrivesScreen;
