import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { testDriveService } from "../../services/testDrivesService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { Button } from "../../components/Button";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../theme";

const TestDrivesScreen = () => {
  const [testDrives, setTestDrives] = useState([]);
  const [filteredTestDrives, setFilteredTestDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
  const [selectedTestDrive, setSelectedTestDrive] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    feedback: "",
    interestRate: 0,
  });

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
          t.customer?.phone?.includes(searchQuery)
      );
      setFilteredTestDrives(filtered);
    } else {
      setFilteredTestDrives(testDrives);
    }
  }, [searchQuery, testDrives]);

  const loadTestDrives = async () => {
    try {
      const data = await testDriveService.getTestDrives();
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

  const handleCompleteTestDrive = async () => {
    if (!selectedTestDrive || !feedbackData.feedback.trim()) return;

    try {
      await testDriveService.completeTestDrive(
        selectedTestDrive._id,
        feedbackData.feedback,
        feedbackData.interestRate || undefined
      );
      setOpenFeedbackModal(false);
      setFeedbackData({ feedback: "", interestRate: 0 });
      loadTestDrives();
    } catch (error) {
      console.error("Complete test drive error:", error);
    }
  };

  const renderTestDrive = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedTestDrive(item);
        if (item.status === "confirmed") setOpenFeedbackModal(true);
      }}
    >
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.infoContainer}>
            <Text style={styles.customerName}>
              {item.customer?.fullName || "Không rõ tên"}
            </Text>
            <Text style={styles.customerPhone}>{item.customer?.phone}</Text>
            <Text style={styles.variantText}>
              Phiên bản: {item.variant?.trim || "N/A"}
            </Text>
            <Text style={styles.timeText}>
              Thời gian: {new Date(item.preferredTime).toLocaleString("vi-VN")}
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

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search bar */}
      <View style={styles.header}>
        <TextInput
          placeholder="Tìm kiếm khách hàng hoặc số điện thoại..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <Button
          title="Tạo lịch lái thử"
          variant="primary"
          size="md"
          onPress={() => navigation.navigate("CreateTestDrive")}
          style={{ marginTop: 8 }}
        />
      </View>

      {/* Test drives list */}
      <FlatList
        data={filteredTestDrives}
        renderItem={renderTestDrive}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
            />
          </View>
        }
      />

      {/* Feedback Modal */}
      <Modal visible={openFeedbackModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ghi nhận phản hồi</Text>
            <TextInput
              placeholder="Nhập phản hồi của khách hàng..."
              value={feedbackData.feedback}
              onChangeText={(text) =>
                setFeedbackData({ ...feedbackData, feedback: text })
              }
              multiline
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Mức độ quan tâm (1-10)"
              value={String(feedbackData.interestRate)}
              onChangeText={(text) =>
                setFeedbackData({ ...feedbackData, interestRate: Number(text) })
              }
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Hủy"
                variant="outline"
                onPress={() => setOpenFeedbackModal(false)}
              />
              <Button title="Hoàn thành" onPress={handleCompleteTestDrive} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16, backgroundColor: theme.colors.backgroundLight },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  card: { marginBottom: 12 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoContainer: { flex: 1 },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  customerPhone: { fontSize: 14, color: theme.colors.textSecondary },
  variantText: { fontSize: 14, color: theme.colors.textSecondary },
  timeText: { fontSize: 14, color: theme.colors.textSecondary },
  feedback: { fontSize: 12, color: theme.colors.textPrimary, marginTop: 4 },
  status: { fontSize: 14, fontWeight: "500", marginTop: 4 },
  status_done: { color: "green" },
  status_confirmed: { color: "#007AFF" },
  status_requested: { color: "#FF9500" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    marginVertical: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
});

export default TestDrivesScreen;
