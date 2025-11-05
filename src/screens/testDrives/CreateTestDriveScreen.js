import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import FlashMessage, { showMessage } from "react-native-flash-message";

import { testDriveService } from "../../services/testDrivesService";
import { customerService } from "../../services/customerService";
import { vehicleService } from "../../services/vehicleService";
import { dealerService } from "../../services/dealerService";
import { Button } from "../../components/Button";
import { Loading } from "../../components/Loading";
import { theme } from "../../theme";
import { useAuth } from "../../context/AuthContext";

const SelectionField = ({ label, value, onPress, required = false }) => (
  <View style={styles.selectionContainer}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={{ color: theme.colors.danger }}>*</Text>}
    </Text>
    <TouchableOpacity
      style={styles.selectionInput}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.selectionText,
          !value && { color: theme.colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {value || `Chọn ${label.toLowerCase()}...`}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  </View>
);

const CreateTestDriveScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // ✅ Danh sách trạng thái
  const statusOptions = [
    { label: "Đã yêu cầu", value: "requested" },
    { label: "Đã xác nhận", value: "confirmed" },
    { label: "Hoàn thành", value: "completed" },
  ];

  const [data, setData] = useState({
    customers: [],
    variants: [],
    dealers: [],
  });

  const [formData, setFormData] = useState({
    customer: null,
    variant: null,
    dealer: null,
    preferredTime: new Date(Date.now() + 86400000),
    status: "requested",
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectModal, setSelectModal] = useState({ visible: false, type: "" });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, vehiclesData, dealersData] = await Promise.all([
          customerService.getCustomers(),
          vehicleService.getVehicles(),
          dealerService.getDealers(),
        ]);

        setData({
          customers: (customersData?.data || customersData || []).map((c) => ({
            _id: c._id,
            fullName: c.fullName,
            phone: c.phone,
          })),
          variants: (vehiclesData?.data || vehiclesData || []).map((v) => ({
            _id: v._id,
            name: v.trim || v.model?.name || `Phiên bản #${v._id.slice(-4)}`,
          })),
          dealers: (dealersData?.data || dealersData || []).map((d) => ({
            _id: d._id,
            name: d.name || d.dealerName || `Đại lý #${d._id.slice(-4)}`,
          })),
        });
      } catch (error) {
        console.error("Load data error:", error);
        showMessage({
          message: "Không thể tải dữ liệu",
          description: "Lỗi khi tải danh sách khách hàng, xe hoặc đại lý.",
          type: "danger",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (
      !formData.customer ||
      !formData.variant ||
      !formData.dealer ||
      !formData.preferredTime
    ) {
      showMessage({
        message: "Thiếu thông tin",
        description: "Vui lòng chọn đầy đủ thông tin bắt buộc.",
        type: "warning",
      });
      return;
    }

    if (!user?._id) {
      showMessage({
        message: "Lỗi người dùng",
        description: "Không xác định được tài khoản đang đăng nhập.",
        type: "danger",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const requestBody = {
        customer: formData.customer,
        variant: formData.variant,
        dealer: formData.dealer,
        assignedStaff: user._id,
        preferredTime: formData.preferredTime.toISOString(),
        status: formData.status,
      };

      await testDriveService.createTestDrive(requestBody);

      showMessage({
        message: "Tạo lịch lái thử thành công!",
        type: "success",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Create test drive error:", error);
      showMessage({
        message: "Không thể tạo lịch lái thử",
        description: "Vui lòng thử lại sau.",
        type: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSelectModal = () => {
    if (!selectModal.visible) return null;
    let items = [];
    let title = "";

    switch (selectModal.type) {
      case "customer":
        items = data.customers;
        title = "Chọn khách hàng";
        break;
      case "variant":
        items = data.variants;
        title = "Chọn xe";
        break;
      case "dealer":
        items = data.dealers;
        title = "Chọn đại lý";
        break;
      case "status":
        items = statusOptions;
        title = "Chọn trạng thái";
        break;
    }

    return (
      <Modal transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{title}</Text>
            <FlatList
              data={items}
              keyExtractor={(item) => item._id || item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    handleChange(
                      selectModal.type,
                      item._id || item.value // ✅ dùng _id cho API data, value cho status
                    );
                    setSelectModal({ visible: false, type: "" });
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.fullName || item.name || item.phone || item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Button
              title="Đóng"
              variant="secondary"
              onPress={() => setSelectModal({ visible: false, type: "" })}
              style={{ marginTop: theme.spacing.md }}
            />
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) return <Loading />;

  const selectedCustomer = data.customers.find(
    (c) => c._id === formData.customer
  );
  const selectedVariant = data.variants.find((v) => v._id === formData.variant);
  const selectedDealer = data.dealers.find((d) => d._id === formData.dealer);
  const selectedStatus = statusOptions.find((s) => s.value === formData.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tạo Lịch Lái Thử</Text>

        <SelectionField
          label="Khách hàng"
          value={
            selectedCustomer
              ? `${selectedCustomer.fullName} - ${selectedCustomer.phone}`
              : ""
          }
          required
          onPress={() => setSelectModal({ visible: true, type: "customer" })}
        />

        <SelectionField
          label="Đại lý"
          value={selectedDealer ? selectedDealer.name : ""}
          required
          onPress={() => setSelectModal({ visible: true, type: "dealer" })}
        />

        <SelectionField
          label="Phiên bản xe"
          value={selectedVariant ? selectedVariant.name : ""}
          required
          onPress={() => setSelectModal({ visible: true, type: "variant" })}
        />

        <SelectionField
          label="Trạng thái"
          value={selectedStatus?.label || ""}
          onPress={() => setSelectModal({ visible: true, type: "status" })}
        />

        <Text style={styles.label}>Thời gian mong muốn*</Text>
        <TouchableOpacity
          style={styles.selectionInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.selectionText}>
            {formData.preferredTime.toLocaleString("vi-VN", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </Text>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={formData.preferredTime}
            mode="datetime"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) handleChange("preferredTime", date);
            }}
          />
        )}

        <Button
          title="Tạo Lịch Lái Thử"
          onPress={handleCreate}
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
          style={{ marginTop: theme.spacing.xl }}
        />
      </ScrollView>

      {renderSelectModal()}
      <FlashMessage position="top" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.lg },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  selectionContainer: { marginBottom: theme.spacing.md },
  selectionInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
  },
  selectionText: { flex: 1, color: theme.colors.textPrimary },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  modalItemText: { fontSize: 16 },
});

export default CreateTestDriveScreen;
