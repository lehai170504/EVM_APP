import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { testDriveService } from "../../services/testDrivesService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";

const DUMMY_ENTITIES = {
  staffs: { "6906e7efa065bce7caab4591": { fullName: "Nhân viên phụ trách X" } },
};

const TestDriveDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { testDriveId } = route.params;
  const [testDrive, setTestDrive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestDriveDetail = async () => {
      try {
        const data = await testDriveService.getTestDriveById(testDriveId);
        setTestDrive(data);
      } catch (error) {
        console.error("Load test drive detail error:", error);
        Alert.alert(
          "Lỗi",
          "Không thể tải chi tiết lịch lái thử. Vui lòng kiểm tra kết nối API."
        );
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener("focus", fetchTestDriveDetail);
    fetchTestDriveDetail();
    return unsubscribe;
  }, [testDriveId, navigation]);

  if (loading) return <Loading />;

  if (!testDrive)
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Không tìm thấy lịch lái thử.</Text>
        <Button title="Quay lại" onPress={() => navigation.goBack()} />
      </View>
    );

  const getStatusStyle = (status) => {
    switch (status) {
      case "done":
        return styles.status_done;
      case "confirmed":
        return styles.status_confirmed;
      case "requested":
        return styles.status_requested;
      default:
        return {};
    }
  };

  const assignedStaffName = testDrive.assignedStaff
    ? DUMMY_ENTITIES.staffs[testDrive.assignedStaff]?.fullName ||
      "Chưa phân công"
    : "Chưa phân công";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Chi tiết Lịch Lái Thử</Text>

        {/* THÔNG TIN CHUNG */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin chung</Text>
          <DetailRow
            icon="time-outline"
            label="Thời gian lái thử"
            value={new Date(testDrive.preferredTime).toLocaleString("vi-VN")}
          />
          <DetailRow
            icon="people-outline"
            label="Nhân viên phụ trách"
            value={assignedStaffName}
          />
          <DetailRow
            icon="stats-chart-outline"
            label="Trạng thái"
            value={testDrive.status.toUpperCase()}
            valueStyle={[styles.status, getStatusStyle(testDrive.status)]}
          />
        </Card>

        {/* THÔNG TIN KHÁCH HÀNG */}
        {testDrive.customer && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <DetailRow
              icon="person-outline"
              label="Tên"
              value={testDrive.customer?.fullName || "Không rõ tên"}
            />
            <DetailRow
              icon="call-outline"
              label="SĐT"
              value={testDrive.customer?.phone || "N/A"}
            />
            <Button
              title="Xem hồ sơ khách hàng"
              variant="outline"
              size="sm"
              style={styles.linkButton}
              onPress={() =>
                navigation.navigate("CustomerDetail", {
                  customerId: testDrive.customer._id,
                })
              }
            />
          </Card>
        )}

        {/* THÔNG TIN XE & ĐẠI LÝ */}
        {(testDrive.variant || testDrive.dealer) && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin xe & đại lý</Text>
            <DetailRow
              icon="location-outline"
              label="Đại lý"
              value={testDrive.dealer?.name || testDrive.dealer || "Không rõ"}
            />
            <DetailRow
              icon="car-outline"
              label="Phiên bản"
              value={testDrive.variant?.trim || testDrive.variant || "N/A"}
            />
            {testDrive.variant?._id && (
              <Button
                title="Xem chi tiết phiên bản xe"
                variant="outline"
                size="sm"
                style={styles.linkButton}
                onPress={() =>
                  navigation.navigate("VehicleDetail", {
                    vehicleId: testDrive.variant._id,
                  })
                }
              />
            )}
          </Card>
        )}

        {/* KẾT QUẢ LÁI THỬ */}
        {testDrive.result && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Kết quả lái thử</Text>
            <DetailRow
              icon="chatbox-outline"
              label="Phản hồi"
              value={testDrive.result.feedback}
              isFeedback
            />
            <DetailRow
              icon="trending-up-outline"
              label="Mức độ quan tâm"
              value={`${testDrive.result.interestRate}/10`}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ icon, label, value, isFeedback, valueStyle }) => (
  <View style={styles.infoRow}>
    <Ionicons
      name={icon}
      size={20}
      color={theme.colors.textSecondary}
      style={styles.icon}
    />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text
      style={[isFeedback ? styles.feedbackValue : styles.infoValue, valueStyle]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing["2xl"],
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
    textAlign: "center",
  },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    flexWrap: "wrap",
  },
  icon: { marginRight: theme.spacing.sm },
  infoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginRight: 8,
  },
  infoValue: { flex: 1, fontSize: 15, color: theme.colors.textPrimary },
  feedbackValue: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  status: { fontWeight: "700", fontSize: 15 },
  status_done: { color: "green" },
  status_confirmed: { color: "#007AFF" },
  status_requested: { color: "#FF9500" },
  linkButton: { marginTop: theme.spacing.sm, alignSelf: "flex-start" },
  actionButton: { marginTop: theme.spacing.md, marginBottom: theme.spacing.lg },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing["3xl"],
  },
  notFoundText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
});

export default TestDriveDetailScreen;
