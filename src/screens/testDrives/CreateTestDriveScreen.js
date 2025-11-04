import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// 1. Import TẤT CẢ service cần thiết
import { testDriveService } from "../../services/testDrivesService";
import { customerService } from "../../services/customerService";
import { vehicleService } from "../../services/vehicleService";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Loading } from "../../components/Loading";
import { theme } from "../../theme";

// Giả định: Các entities chưa có service (như Dealer, Staff)
const DUMMY_ENTITIES = {
  dealers: [
    { _id: "68f90ebebeaef72ecf6e005b", name: "Đại lý EV Hà Nội" },
    { _id: "D_002", name: "Đại lý EV Hồ Chí Minh" },
  ],
  staffs: [
    { _id: "68f90ebebeaef72ecf6e005d", fullName: "Nhân viên Phụ trách A" },
    { _id: "S_002", fullName: "Nhân viên Phụ trách B" },
  ],
};

// Component helper cho việc chọn
const SelectionField = ({ label, value, onPress, required = false }) => (
  <View style={createStyles.selectionContainer}>
    <Text style={createStyles.label}>
      {label}{" "}
      {required && <Text style={{ color: theme.colors.danger }}>*</Text>}
    </Text>
    <TouchableOpacity
      style={createStyles.selectionInput}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          createStyles.selectionText,
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
  const [data, setData] = useState({
    customers: [],
    variants: [],
    dealers: DUMMY_ENTITIES.dealers,
    staffs: DUMMY_ENTITIES.staffs,
  });
  const [formData, setFormData] = useState({
    customer: null,
    dealer: DUMMY_ENTITIES.dealers[0]?._id || null,
    variant: null,
    preferredTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    assignedStaff: DUMMY_ENTITIES.staffs[0]?._id || null,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Logic Fetch Data ---
  useEffect(() => {
    const loadRequiredData = async () => {
      try {
        const [customersData, vehiclesData] = await Promise.all([
          customerService.getCustomers(),
          vehicleService.getVehicles(),
        ]);

        const customers = Array.isArray(customersData)
          ? customersData
          : customersData.data || [];
        const variants = Array.isArray(vehiclesData)
          ? vehiclesData
          : vehiclesData.data || [];

        // Lấy dữ liệu cần thiết: fullName/phone và trim/name
        setData((prev) => ({
          ...prev,
          customers: customers.map((c) => ({
            _id: c._id,
            fullName: c.fullName,
            phone: c.phone,
          })),
          variants: variants.map((v) => ({
            _id: v._id,
            name: v.trim || v.model?.name || `Phiên bản #${v._id.slice(-4)}`,
          })),
        }));

        // Thiết lập giá trị mặc định cho form
        if (customers.length > 0)
          setFormData((prev) => ({ ...prev, customer: customers[0]._id }));
        if (variants.length > 0)
          setFormData((prev) => ({ ...prev, variant: variants[0]._id }));
      } catch (error) {
        console.error("Load essential data error:", error);
        Alert.alert(
          "Lỗi tải dữ liệu",
          "Không thể tải danh sách Khách hàng/Xe. Vui lòng kiểm tra kết nối API."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRequiredData();
  }, []);

  // --- Logic Form Handling ---
  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const getSelectedItem = (list, id, key = "_id") =>
    list.find((item) => item[key] === id);

  const handleCreateTestDrive = async () => {
    // 1. Validate
    if (
      !formData.customer ||
      !formData.dealer ||
      !formData.preferredTime ||
      !formData.variant
    ) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn đầy đủ các trường bắt buộc."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Chuẩn bị request body
      const requestBody = {
        customer: formData.customer,
        dealer: formData.dealer,
        variant: formData.variant,
        preferredTime: new Date(formData.preferredTime).toISOString(),
        status: "requested",
        assignedStaff: formData.assignedStaff,
      };

      // 3. Gọi API thực tế
      await testDriveService.create(requestBody);

      Alert.alert("Thành công 🎉", "Lịch lái thử đã được tạo thành công!");
      navigation.goBack();
    } catch (error) {
      console.error(
        "Create test drive error:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.message ||
        "Đã xảy ra lỗi trong quá trình tạo lịch lái thử. Vui lòng kiểm tra định dạng thời gian.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  // Lấy tên hiển thị
  const selectedCustomer = getSelectedItem(data.customers, formData.customer);
  const selectedDealer = getSelectedItem(data.dealers, formData.dealer);
  const selectedVariant = getSelectedItem(data.variants, formData.variant);
  const selectedStaff = getSelectedItem(data.staffs, formData.assignedStaff);

  const customerDisplay = selectedCustomer
    ? `${selectedCustomer.fullName} - ${selectedCustomer.phone}`
    : data.customers.length === 0
    ? "Chưa có khách hàng nào"
    : null;

  const variantDisplay = selectedVariant
    ? selectedVariant.name
    : data.variants.length === 0
    ? "Chưa có phiên bản xe nào"
    : null;

  const dealerDisplay = selectedDealer ? selectedDealer.name : null;
  const staffDisplay = selectedStaff ? selectedStaff.fullName : null;

  return (
    <SafeAreaView style={createStyles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={createStyles.scrollContent}>
        <Text style={createStyles.title}>Tạo Lịch Lái Thử Mới</Text>

        {/* Khách hàng - Mô phỏng chọn */}
        <SelectionField
          label="Khách hàng"
          value={customerDisplay}
          required={true}
          onPress={() =>
            Alert.alert(
              "Chọn Khách hàng",
              `Mô phỏng chọn: Đã chọn ${customerDisplay}`
            )
          }
        />

        {/* Đại lý - Mô phỏng chọn */}
        <SelectionField
          label="Đại lý"
          value={dealerDisplay}
          required={true}
          onPress={() =>
            Alert.alert(
              "Chọn Đại lý",
              `Mô phỏng chọn: Đã chọn ${dealerDisplay}`
            )
          }
        />

        {/* Phiên bản xe - Mô phỏng chọn */}
        <SelectionField
          label="Phiên bản xe"
          value={variantDisplay}
          required={true}
          onPress={() =>
            Alert.alert(
              "Chọn Phiên bản",
              `Mô phỏng chọn: Đã chọn ${variantDisplay}`
            )
          }
        />

        {/* Thời gian mong muốn */}
        <Text style={createStyles.label}>
          Thời gian mong muốn (YYYY-MM-DDTHH:MM)
          <Text style={{ color: theme.colors.danger }}>*</Text>
        </Text>
        <Input
          placeholder="Ví dụ: 2025-12-26T10:00"
          value={formData.preferredTime}
          onChangeText={(text) => handleChange("preferredTime", text)}
          style={createStyles.input}
        />

        {/* Nhân viên phụ trách - Mô phỏng chọn */}
        <SelectionField
          label="Nhân viên phụ trách"
          value={staffDisplay}
          onPress={() =>
            Alert.alert(
              "Chọn Nhân viên",
              `Mô phỏng chọn: Đã chọn ${staffDisplay}`
            )
          }
        />

        <Button
          title="Tạo Lịch Lái Thử"
          variant="primary"
          size="lg"
          onPress={handleCreateTestDrive}
          style={createStyles.button}
          loading={isSubmitting}
          disabled={
            isSubmitting ||
            !formData.customer ||
            !formData.variant ||
            !formData.dealer
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
    textAlign: "center",
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  input: {
    marginBottom: 0,
  },
  button: {
    marginTop: theme.spacing["3xl"],
  },
  selectionContainer: {
    marginBottom: theme.spacing.md,
  },
  selectionInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 44,
  },
  selectionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    flex: 1,
  },
});

export default CreateTestDriveScreen;
