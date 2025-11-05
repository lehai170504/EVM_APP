import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert, // Sử dụng Alert thay vì showMessage cho validation ngay trên màn hình
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Giả định rằng các service và component của bạn đã được import đúng
import { quoteService } from "../../services/quoteService";
import { customerService } from "../../services/customerService";
import { vehicleService } from "../../services/vehicleService";
import { promotionService } from "../../services/promotionService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { showMessage } from "react-native-flash-message";

const CreateQuoteScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [colors, setColors] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState({});
  const [colorModalVisible, setColorModalVisible] = useState({});
  const [promotionModalVisible, setPromotionModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [items, setItems] = useState([
    { variant: "", color: "", qty: 1, unitPrice: 0 },
  ]);
  const [fees, setFees] = useState({ registration: 0, plate: 0, delivery: 0 });
  const [validUntil, setValidUntil] = useState(null);
  const [notes, setNotes] = useState("");

  const [subtotal, setSubtotal] = useState(0);
  const [promotionTotal, setPromotionTotal] = useState(0); // Giảm giá thực tế sau khi check Scope
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Date picker state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  useEffect(() => {
    loadData();
  }, []);

  // --- HÀM TÍNH TOÁN TỔNG (BAO GỒM CHECK SCOPE) ---
  const recalculateTotals = useCallback(() => {
    // 1. Tính Subtotal (Đã bao gồm phụ phí màu sắc)
    const sub = items.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * (item.qty || 0),
      0
    );

    // 2. Tính Promotion Total (Có kiểm tra điều kiện Scope)
    let promoTotal = 0;

    if (selectedPromotion && sub > 0) {
      const promotion = selectedPromotion;
      let applicable = true;
      let calculatedDiscount = 0;

      // --- 2.1. Kiểm tra Scope ---
      if (promotion.scope === "byDealer") {
        // Giả định: dealerId của khuyến mãi phải khớp với dealerId của khách hàng
        // LƯU Ý: Nếu selectedCustomer.dealerId không tồn tại, KHUYẾN MÃI NÀY SẼ KHÔNG ÁP DỤNG
        const customerDealerId = selectedCustomer?.dealerId;
        const dealerIdsInPromo = promotion.dealers?.map((d) => d._id) || [];

        if (!customerDealerId || !dealerIdsInPromo.includes(customerDealerId)) {
          applicable = false;
        }
      } else if (promotion.scope === "byVariant") {
        // Kiểm tra xem ít nhất một sản phẩm trong báo giá có nằm trong danh sách 'variants' của khuyến mãi không
        const promoVariantIds = promotion.variants?.map((v) => v._id) || [];
        const itemsInQuoteVariantIds = items
          .map((item) => item.variant)
          .filter((id) => id); // Lọc bỏ id rỗng

        const isAnyItemCovered = itemsInQuoteVariantIds.some((itemId) =>
          promoVariantIds.includes(itemId)
        );

        if (!isAnyItemCovered) {
          applicable = false;
        }
      }
      // --- 2.2. Kiểm tra Ngày Hết Hạn (Làm thêm 1 lần nữa để đảm bảo) ---
      const now = new Date();
      if (promotion.validTo && now > new Date(promotion.validTo)) {
        applicable = false;
      }

      // 2.3. Tính toán giảm giá nếu hợp lệ
      if (applicable) {
        if (promotion.discountAmount) {
          calculatedDiscount = Math.min(promotion.discountAmount, sub);
        } else if (promotion.discountPercent) {
          calculatedDiscount = (sub * promotion.discountPercent) / 100;
        } else if (promotion.type === "accessory" && promotion.value) {
          // Tạm thời coi value của 'accessory' là giảm giá tiền mặt
          calculatedDiscount = Math.min(promotion.value, sub);
        }

        promoTotal = calculatedDiscount;

        // Nếu đã áp dụng, không cần cảnh báo. Nếu không áp dụng, logic bên dưới sẽ xử lý
      } else {
        // Có khuyến mãi được chọn, nhưng không áp dụng được
        promoTotal = 0;
      }
    }

    setSubtotal(sub);
    setPromotionTotal(promoTotal);

    // 3. Tính Tổng cộng (Total)
    const totalAmount =
      sub -
      promoTotal +
      (fees.registration || 0) +
      (fees.plate || 0) +
      (fees.delivery || 0);

    setTotal(totalAmount);
  }, [items, fees, selectedPromotion, selectedCustomer]); // Dependency list đầy đủ

  useEffect(() => {
    recalculateTotals();
  }, [recalculateTotals]);

  // --- PHẦN CÒN LẠI CỦA LOGIC ---

  const loadData = async () => {
    try {
      // ... (Giữ nguyên logic loadData)
      const [customersData, vehiclesData, colorsData, promotionsData] =
        await Promise.all([
          customerService.getCustomers(),
          vehicleService.getVehicles(),
          vehicleService.getVehicleColors(),
          promotionService.getPromotions(),
        ]);
      setCustomers(
        Array.isArray(customersData) ? customersData : customersData?.data || []
      );
      setVehicles(
        Array.isArray(vehiclesData) ? vehiclesData : vehiclesData?.data || []
      );
      setColors(
        Array.isArray(colorsData) ? colorsData : colorsData?.data || []
      );
      setPromotions(
        Array.isArray(promotionsData)
          ? promotionsData
          : promotionsData?.data || []
      );
    } catch (error) {
      console.error("Load data error:", error);
      showMessage({
        message: "Lỗi tải dữ liệu",
        description:
          "Tải dữ liệu thất bại: " +
          (error.response?.data?.message || error.message),
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "variant") {
      const vehicle = vehicles.find((v) => v._id === value);
      if (vehicle) {
        // Đặt giá cơ bản MSRP
        newItems[index].unitPrice = vehicle.msrp || 0;
        newItems[index].color = ""; // Reset màu
      }
    }

    if (field === "color") {
      const selectedVehicle = vehicles.find(
        (v) => v._id === newItems[index].variant
      );
      const selectedColor = colors.find((c) => c._id === value);

      // Tính lại UnitPrice: MSRP + Phụ phí màu (extraPrice)
      const msrp = selectedVehicle?.msrp || 0;
      const extraPrice = selectedColor?.extraPrice || 0;
      newItems[index].unitPrice = msrp + extraPrice;
    }

    // Cập nhật sau khi có thể đã thay đổi unitPrice do chọn variant/color
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { variant: "", color: "", qty: 1, unitPrice: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Alert.alert("Lỗi", "Vui lòng chọn khách hàng");
      return;
    }

    if (
      items.some(
        (item) => !item.variant || item.qty <= 0 || item.unitPrice <= 0
      )
    ) {
      Alert.alert(
        "Lỗi",
        "Vui lòng điền đầy đủ thông tin sản phẩm (Mẫu xe, Số lượng, Đơn giá > 0)"
      );
      return;
    }

    // Kiểm tra nhanh lại xem promotionTotal có đang bị lỗi không
    if (selectedPromotion && promotionTotal === 0 && subtotal > 0) {
      Alert.alert(
        "Cảnh báo Khuyến mãi",
        `Khuyến mãi "${selectedPromotion.name}" được chọn nhưng không được áp dụng do không thỏa mãn điều kiện (Scope hoặc Hết hạn). Bạn có muốn tiếp tục tạo báo giá không?`,
        [
          { text: "Hủy", style: "cancel" },
          { text: "Tiếp tục", onPress: () => proceedSubmit() },
        ]
      );
      return;
    }

    // Nếu không có cảnh báo hoặc đã đồng ý cảnh báo
    proceedSubmit();
  };

  const proceedSubmit = async () => {
    setSubmitting(true);

    // LƯU Ý QUAN TRỌNG:
    // Chúng ta sử dụng state subtotal, promotionTotal, và total đã được tính toán
    // chính xác trong useEffect (bao gồm cả kiểm tra Scope).

    try {
      const quoteData = {
        customer: selectedCustomer._id,
        items: items.map((item) => ({
          variant: item.variant,
          ...(item.color && { color: item.color }),
          qty: item.qty,
          unitPrice: item.unitPrice, // UnitPrice ĐÃ BAO GỒM PHỤ PHÍ MÀU
        })),
        subtotal,
        discount: 0,
        promotion: selectedPromotion ? selectedPromotion._id : undefined, // Gửi ID khuyến mãi đã chọn
        promotionTotal: promotionTotal, // Giảm giá thực tế đã kiểm tra
        fees,
        total: total, // Tổng đã trừ giảm giá thực tế
        ...(validUntil && { validUntil: validUntil.toISOString() }),
        ...(notes.trim() && { notes: notes.trim() }),
        // ... (Thông tin dealer nếu cần)
      };

      const result = await quoteService.createQuote(quoteData);
      showMessage({
        message: "🎉 Thành công!",
        description: "Báo giá đã được tạo thành công.",
        type: "success",
        backgroundColor: "#4CAF50",
        color: "#fff",
        icon: "success",
        duration: 2500,
        floating: true,
      });
      navigation.goBack();
    } catch (error) {
      console.error("Create quote error:", error);
      showMessage({
        message: "❌ Thất bại!",
        description:
          "Không thể tạo báo giá. " +
          (error.response?.data?.message ||
            error.message ||
            "Lỗi không xác định."),
        type: "danger",
        backgroundColor: "#E53935",
        color: "#fff",
        icon: "danger",
        duration: 3000,
        floating: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateSelect = () => {
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    setValidUntil(date);
    setDatePickerVisible(false);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const renderDatePickerModal = () => {
    // ... (Giữ nguyên component renderDatePickerModal)
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const years = Array.from(
      { length: 10 },
      (_, i) => new Date().getFullYear() + i
    );
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ngày hết hạn</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.datePickerContent}>
              <View style={styles.datePickerRow}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Năm</Text>
                  <ScrollView style={styles.datePickerList}>
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.datePickerItem,
                          selectedYear === year &&
                            styles.datePickerItemSelected,
                        ]}
                        onPress={() => setSelectedYear(year)}
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            selectedYear === year &&
                              styles.datePickerItemTextSelected,
                          ]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Tháng</Text>
                  <ScrollView style={styles.datePickerList}>
                    {months.map((month) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.datePickerItem,
                          selectedMonth === month &&
                            styles.datePickerItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedMonth(month);
                          const maxDay = getDaysInMonth(selectedYear, month);
                          if (selectedDay > maxDay) setSelectedDay(maxDay);
                        }}
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            selectedMonth === month &&
                              styles.datePickerItemTextSelected,
                          ]}
                        >
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Ngày</Text>
                  <ScrollView style={styles.datePickerList}>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.datePickerItem,
                          selectedDay === day && styles.datePickerItemSelected,
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            selectedDay === day &&
                              styles.datePickerItemTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </ScrollView>
            <View style={styles.datePickerFooter}>
              <Button
                title="Xác nhận"
                variant="primary"
                onPress={handleDateSelect}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    );
    // ...
  };

  const renderPromotionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        // Kiểm tra điều kiện áp dụng cơ bản (Ngày hết hạn) ngay tại đây
        const now = new Date();
        const validTo = new Date(item.validTo);

        if (item.validTo && now > validTo) {
          showMessage({
            message: "Khuyến mãi hết hạn",
            description: `Khuyến mãi "${item.name}" đã hết hạn.`,
            type: "warning",
          });
          return;
        }

        // Logic: Chỉ cho phép chọn 1 khuyến mãi.
        setSelectedPromotion(item);
        setPromotionModalVisible(false);
      }}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemTitle}>{item.name || item.title}</Text>
        <Text style={styles.modalItemSubtitle}>
          Phạm vi: **{item.scope}** | Loại: **{item.type}**
          {item.discountAmount
            ? ` (Giảm ${item.discountAmount.toLocaleString("vi-VN")} đ)`
            : item.discountPercent
            ? ` (Giảm ${item.discountPercent}%)`
            : item.value
            ? ` (Giảm ${item.value.toLocaleString("vi-VN")} đ)`
            : "Không rõ mức giảm"}
        </Text>
      </View>
      {selectedPromotion?._id === item._id && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );

  const renderCustomerItem = ({ item }) => (
    // ... (Giữ nguyên renderCustomerItem)
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedCustomer(item);
        setCustomerModalVisible(false);
      }}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemTitle}>{item.fullName}</Text>
        <Text style={styles.modalItemSubtitle}>
          {item.phone} • {item.email}
        </Text>
      </View>
      {selectedCustomer?._id === item._id && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );

  const renderVariantItem = ({ item }, itemIndex) => {
    // ... (Giữ nguyên renderVariantItem)
    const modelName = typeof item.model === "object" ? item.model?.name : "N/A";
    return (
      <TouchableOpacity
        style={styles.modalItem}
        onPress={() => {
          updateItem(itemIndex, "variant", item._id);
          setVariantModalVisible({
            ...variantModalVisible,
            [itemIndex]: false,
          });
        }}
      >
        <View style={styles.modalItemContent}>
          <Text style={styles.modalItemTitle}>
            {modelName} - {item.trim}
          </Text>
          <Text style={styles.modalItemSubtitle}>
            {item.msrp?.toLocaleString("vi-VN")} đ
            {item.range && ` • ${item.range} km`}
            {item.motorPower && ` • ${item.motorPower} kW`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderColorItem = ({ item }, itemIndex) => (
    // ... (Giữ nguyên renderColorItem)
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        updateItem(itemIndex, "color", item._id);
        setColorModalVisible({ ...colorModalVisible, [itemIndex]: false });
      }}
    >
      <View
        style={[styles.colorSwatch, { backgroundColor: item.hex || "#ccc" }]}
      />
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemTitle}>{item.name}</Text>
        {item.extraPrice > 0 && (
          <Text style={styles.modalItemSubtitle}>
            +{item.extraPrice.toLocaleString("vi-VN")} đ
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Customer Selection */}
        <Card>
          <Text style={styles.sectionTitle}>Khách hàng</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setCustomerModalVisible(true)}
          >
            <View style={styles.pickerContent}>
              {selectedCustomer ? (
                <View>
                  <Text style={styles.pickerText}>
                    {selectedCustomer.fullName}
                  </Text>
                  <Text style={styles.pickerSubtext}>
                    {selectedCustomer.phone}
                  </Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>Chọn khách hàng</Text>
              )}
            </View>
            <Ionicons
              name="chevron-down"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </Card>

        {/* Items Section */}
        <Card>
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm</Text>
            <TouchableOpacity onPress={addItem} style={styles.addButton}>
              <Ionicons
                name="add-circle"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {items.map((item, index) => {
            const selectedVehicle = vehicles.find(
              (v) => v._id === item.variant
            );
            const selectedColor = colors.find((c) => c._id === item.color);
            const modelName = selectedVehicle
              ? typeof selectedVehicle.model === "object"
                ? selectedVehicle.model?.name
                : "N/A"
              : "Chọn mẫu xe";

            return (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Sản phẩm {index + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(index)}>
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={theme.colors.error}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Variant Picker */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Mẫu xe *</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() =>
                      setVariantModalVisible({
                        ...variantModalVisible,
                        [index]: true,
                      })
                    }
                  >
                    <View style={styles.pickerContent}>
                      <Text style={styles.pickerText}>
                        {modelName}{" "}
                        {selectedVehicle?.trim
                          ? `- ${selectedVehicle.trim}`
                          : ""}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Color Picker */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Màu sắc</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() =>
                      setColorModalVisible({
                        ...colorModalVisible,
                        [index]: true,
                      })
                    }
                    disabled={!item.variant}
                  >
                    <View style={styles.pickerContent}>
                      {selectedColor ? (
                        <View style={styles.colorPickerContent}>
                          <View
                            style={[
                              styles.colorSwatchSmall,
                              { backgroundColor: selectedColor.hex || "#ccc" },
                            ]}
                          />
                          <Text style={styles.pickerText}>
                            {selectedColor.name}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.pickerPlaceholder,
                            !item.variant && styles.pickerDisabled,
                          ]}
                        >
                          {item.variant ? "Chọn màu sắc" : "Chọn mẫu xe trước"}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={
                        !item.variant
                          ? theme.colors.textTertiary
                          : theme.colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Quantity */}
                <Input
                  label="Số lượng *"
                  value={item.qty?.toString()}
                  onChangeText={(text) =>
                    updateItem(index, "qty", parseInt(text) || 0)
                  }
                  keyboardType="numeric"
                />

                {/* Unit Price (Đã bao gồm màu) */}
                <Input
                  label="Đơn giá *"
                  value={item.unitPrice?.toLocaleString("vi-VN")}
                  onChangeText={(text) =>
                    updateItem(
                      index,
                      "unitPrice",
                      parseInt(text.replace(/\./g, "")) || 0
                    )
                  }
                  keyboardType="numeric"
                />
              </View>
            );
          })}
        </Card>

        {/* Pricing Section */}
        <Card>
          <Text style={styles.sectionTitle}>Giá và phí</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tạm tính (chưa giảm giá):</Text>
            <Text style={styles.priceValue}>
              {subtotal.toLocaleString("vi-VN")} đ
            </Text>
          </View>

          {/* Promotion Picker */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Khuyến mãi</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setPromotionModalVisible(true)}
            >
              <View style={styles.pickerContent}>
                {selectedPromotion ? (
                  <View>
                    <Text style={styles.pickerText}>
                      {selectedPromotion.name || selectedPromotion.title}
                    </Text>
                    <Text style={styles.pickerSubtext}>
                      {selectedPromotion.discountAmount
                        ? `Giảm ${selectedPromotion.discountAmount.toLocaleString(
                            "vi-VN"
                          )} đ`
                        : selectedPromotion.discountPercent
                        ? `Giảm ${selectedPromotion.discountPercent}%`
                        : selectedPromotion.value
                        ? `Giảm ${selectedPromotion.value.toLocaleString(
                            "vi-VN"
                          )} đ`
                        : "Đã chọn khuyến mãi"}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.pickerPlaceholder}>
                    Chọn khuyến mãi (nếu có)
                  </Text>
                )}
              </View>
              {selectedPromotion && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedPromotion(null);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {promotionTotal > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giảm giá Khuyến mãi:</Text>
              <Text
                style={[styles.priceValue, { color: theme.colors.success }]}
              >
                -{promotionTotal.toLocaleString("vi-VN")} đ
              </Text>
            </View>
          )}

          <Input
            label="Phí đăng ký"
            value={fees.registration?.toLocaleString("vi-VN")}
            onChangeText={(text) =>
              setFees({
                ...fees,
                registration: parseInt(text.replace(/\./g, "")) || 0,
              })
            }
            keyboardType="numeric"
          />

          <Input
            label="Phí biển số"
            value={fees.plate?.toLocaleString("vi-VN")}
            onChangeText={(text) =>
              setFees({
                ...fees,
                plate: parseInt(text.replace(/\./g, "")) || 0,
              })
            }
            keyboardType="numeric"
          />

          <Input
            label="Phí giao hàng"
            value={fees.delivery?.toLocaleString("vi-VN")}
            onChangeText={(text) =>
              setFees({
                ...fees,
                delivery: parseInt(text.replace(/\./g, "")) || 0,
              })
            }
            keyboardType="numeric"
          />

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString("vi-VN")} đ
            </Text>
          </View>
        </Card>

        {/* Additional Info */}
        <Card>
          <Text style={styles.sectionTitle}>Thông tin bổ sung</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Ngày hết hạn</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setDatePickerVisible(true)}
            >
              <View style={styles.pickerContent}>
                {validUntil ? (
                  <Text style={styles.pickerText}>
                    {format(validUntil, "dd/MM/yyyy")}
                  </Text>
                ) : (
                  <Text style={styles.pickerPlaceholder}>
                    Chọn ngày hết hạn
                  </Text>
                )}
              </View>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.textAreaContainer}>
            <Text style={styles.textAreaLabel}>Ghi chú (tùy chọn)</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Nhập ghi chú (không bắt buộc)..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Card>

        <Button
          title={submitting ? "Đang xử lý..." : "Tạo báo giá"}
          variant="primary"
          onPress={handleSubmit}
          disabled={submitting}
          fullWidth
          style={[
            styles.submitButton,
            submitting && { backgroundColor: "#CBD5E1" },
          ]}
        />
      </ScrollView>

      {/* Modals */}
      {/* Customer Modal */}
      <Modal
        visible={customerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khách hàng</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={customers}
              keyExtractor={(item) => item._id}
              renderItem={renderCustomerItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Không có khách hàng</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Variant Modals */}
      {items.map((item, index) => (
        <Modal
          key={`variant-${index}`}
          visible={variantModalVisible[index] || false}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setVariantModalVisible({ ...variantModalVisible, [index]: false })
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn mẫu xe</Text>
                <TouchableOpacity
                  onPress={() =>
                    setVariantModalVisible({
                      ...variantModalVisible,
                      [index]: false,
                    })
                  }
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={vehicles}
                keyExtractor={(item) => item._id}
                renderItem={(props) => renderVariantItem(props, index)}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Không có mẫu xe</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      ))}

      {/* Color Modals */}
      {items.map((item, index) => (
        <Modal
          key={`color-${index}`}
          visible={colorModalVisible[index] || false}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setColorModalVisible({ ...colorModalVisible, [index]: false })
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn màu sắc</Text>
                <TouchableOpacity
                  onPress={() =>
                    setColorModalVisible({
                      ...colorModalVisible,
                      [index]: false,
                    })
                  }
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={colors}
                keyExtractor={(item) => item._id}
                renderItem={(props) => renderColorItem(props, index)}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Không có màu sắc</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      ))}

      {/* Promotion Modal */}
      <Modal
        visible={promotionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPromotionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khuyến mãi</Text>
              <TouchableOpacity onPress={() => setPromotionModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={promotions}
              keyExtractor={(item) => item._id}
              renderItem={renderPromotionItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Không có khuyến mãi</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {renderDatePickerModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (Giữ nguyên StyleSheet)
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 10,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pickerContent: {
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    color: "#1E293B",
  },
  pickerSubtext: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  pickerPlaceholder: {
    color: "#94A3B8",
  },
  pickerDisabled: {
    color: "#94A3B8",
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: "#E0F2FE",
    padding: 8,
    borderRadius: 10,
  },
  itemCard: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: "#64748B",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 10,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E3A8A",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  textAreaContainer: {
    marginTop: 4,
  },
  textAreaLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: 4,
  },
  textArea: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#1E293B",
    minHeight: 100,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  colorSwatchSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  colorPickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
  },
  // Date Picker Styles
  datePickerModal: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 16,
  },
  datePickerContent: {
    padding: 12,
  },
  datePickerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  datePickerColumn: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  datePickerList: {
    maxHeight: 200,
    width: "100%",
  },
  datePickerItem: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  datePickerItemSelected: {
    backgroundColor: "#3B82F6", // theme.colors.primary
  },
  datePickerItemText: {
    fontSize: 16,
    color: "#1E293B",
  },
  datePickerItemTextSelected: {
    color: "#FFFFFF", // theme.colors.textWhite
    fontWeight: "bold",
  },
  datePickerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
});

export default CreateQuoteScreen;
