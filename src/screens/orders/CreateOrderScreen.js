import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { orderService } from "../../services/orderService";
import { customerService } from "../../services/customerService";
import { vehicleService } from "../../services/vehicleService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";

const CreateOrderScreen = ({ navigation, route }) => {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState({});
  const [colorModalVisible, setColorModalVisible] = useState({});

  const [items, setItems] = useState([
    { variant: "", color: "", qty: 1, unitPrice: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [deposit, setDeposit] = useState(0);

  // === THÊM CÁC STATE MỚI ĐỂ LƯU THÔNG TIN TÀI CHÍNH TỪ BÁO GIÁ ===
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [promotionTotal, setPromotionTotal] = useState(0);
  const [fees, setFees] = useState({});

  const [totalAmount, setTotalAmount] = useState(0); // Tổng tiền cuối cùng
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Load dữ liệu
  useEffect(() => {
    loadData();
  }, []);

  // 2. Xử lý initialData từ QuoteDetailScreen sau khi loadData hoàn tất
  useEffect(() => {
    if (loading === false) {
      const { initialData } = route.params || {};

      if (initialData) {
        console.log("Khởi tạo đơn hàng từ báo giá:", initialData);

        // Tự động tìm và chọn khách hàng
        const customerToSelect =
          initialData.customer &&
          customers.find((c) => c._id === initialData.customer._id);
        setSelectedCustomer(customerToSelect || null);

        setPaymentMethod(initialData.paymentMethod || "cash");
        setDeposit(parseInt(initialData.deposit) || 0);

        // === ÁP DỤNG THÔNG TIN TÀI CHÍNH TỪ BÁO GIÁ ===
        setDiscount(initialData.discount || 0);
        setPromotionTotal(initialData.promotionTotal || 0);
        setFees(initialData.fees || {}); // Áp dụng phí

        if (initialData.items && initialData.items.length > 0) {
          const newItems = initialData.items.map((item) => {
            return {
              variant: item.variant?._id || "",
              color: item.color?._id || "",
              qty: item.qty || 1,
              unitPrice: item.unitPrice || 0,
            };
          });
          setItems(newItems);
        }

        // Clear params để tránh việc load lại khi quay lại màn hình
        navigation.setParams({ initialData: undefined });
      }
    }
  }, [route.params, loading, customers, vehicles, colors]);

  // 3. Tính tổng tiền - Chạy lại khi items, discount, promotionTotal hoặc fees thay đổi
  useEffect(() => {
    calculateTotal();
  }, [items, discount, promotionTotal, fees]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersData, vehiclesData, colorsData] = await Promise.all([
        customerService.getCustomers(),
        vehicleService.getVehicles(),
        vehicleService.getVehicleColors(),
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
    } catch (error) {
      console.error("Load data error:", error);
      Alert.alert(
        "Tải dữ liệu thất bại",
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    // 1. Tính tổng tiền sản phẩm (Product Subtotal)
    const productSubtotal = items.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * (item.qty || 0),
      0
    );
    setSubtotal(productSubtotal);

    // 2. Tính tổng Phí liên quan
    const totalFees = Object.values(fees).reduce(
      (sum, fee) => sum + (fee || 0),
      0
    );

    // 3. Tính Tổng tiền trước giảm giá (Gross Total)
    const grossTotal = productSubtotal + totalFees;

    // 4. Áp dụng Giảm giá và Khuyến mãi
    const finalTotal = grossTotal - discount - promotionTotal;

    setTotalAmount(finalTotal > 0 ? finalTotal : 0);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "variant") {
      const vehicle = vehicles.find((v) => v._id === value);
      if (vehicle) {
        newItems[index].unitPrice = vehicle.msrp || 0;
        newItems[index].color = "";
      }
    }
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
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin sản phẩm");
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        customer: selectedCustomer._id,
        items: items.map((item) => ({
          variant: item.variant,
          ...(item.color && { color: item.color }),
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
        ...(deposit > 0 && { deposit }),

        // === GỬI ĐẦY ĐỦ CÁC TRƯỜNG TÀI CHÍNH LÊN API ===
        subtotal: subtotal,
        discount: discount,
        promotionTotal: promotionTotal,
        fees: fees,
        totalAmount: totalAmount, // Sử dụng totalAmount đã tính
      };

      await orderService.createOrder(orderData);
      Alert.alert("Thành công", "Tạo đơn hàng thành công");

      // === FIX NAVIGATION: Điều hướng về OrdersScreen và xóa CreateOrderScreen khỏi stack ===
      // Target MainTabs và dùng params.screen để chỉ định tab 'Orders'
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "MainTabs",
            params: {
              screen: "Orders",
            },
          },
        ],
      });
    } catch (error) {
      console.error("Create order error:", error);
      Alert.alert(
        "Tạo đơn hàng thất bại",
        error.response?.data?.message || error.message || "Lỗi không xác định"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm render item (giữ nguyên)
  const renderCustomerItem = ({ item }) => (
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
    const modelName = typeof item.model === "object" ? item.model?.name : "N/A";
    const isSelected = items[itemIndex].variant === item._id;

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
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderColorItem = ({ item }, itemIndex) => {
    const isSelected = items[itemIndex].color === item._id;
    return (
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
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading />;
  }

  const totalFees = Object.values(fees).reduce(
    (sum, fee) => sum + (fee || 0),
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        {/* Payment Method */}
        <Card>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === "cash" && styles.selectedPayment,
              ]}
              onPress={() => setPaymentMethod("cash")}
            >
              <View style={styles.paymentMethodContent}>
                <Ionicons
                  name="cash-outline"
                  size={24}
                  color={
                    paymentMethod === "cash"
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.paymentText,
                    paymentMethod === "cash" && styles.selectedPaymentText,
                  ]}
                >
                  Tiền mặt
                </Text>
              </View>
              {paymentMethod === "cash" && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === "finance" && styles.selectedPayment,
              ]}
              onPress={() => setPaymentMethod("finance")}
            >
              <View style={styles.paymentMethodContent}>
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={
                    paymentMethod === "finance"
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.paymentText,
                    paymentMethod === "finance" && styles.selectedPaymentText,
                  ]}
                >
                  Trả góp
                </Text>
              </View>
              {paymentMethod === "finance" && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Deposit */}
        <Card>
          <Text style={styles.sectionTitle}>Tiền đặt cọc</Text>
          <Input
            label="Số tiền đặt cọc (tùy chọn)"
            value={deposit?.toLocaleString("vi-VN")}
            onChangeText={(text) =>
              setDeposit(parseInt(text.replace(/\./g, "")) || 0)
            }
            keyboardType="numeric"
            placeholder="0"
          />
          {deposit > 0 && (
            <View style={styles.depositInfo}>
              <Text style={styles.depositText}>
                Đã đặt cọc: {deposit.toLocaleString("vi-VN")} đ
              </Text>
            </View>
          )}
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

                {/* Unit Price */}
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

        {/* Financial Summary */}
        <Card>
          <Text style={styles.sectionTitle}>Tóm tắt tài chính</Text>
          {/* Subtotal */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính (Sản phẩm):</Text>
            <Text style={styles.summaryValue}>
              {subtotal.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          {/* Fees */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng Phí liên quan:</Text>
            <Text style={styles.summaryValue}>
              {totalFees.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          {/* Discount */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giảm giá:</Text>
            <Text style={styles.summaryDiscount}>
              -{discount.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          {/* Promotion */}
          <View style={[styles.summaryRow, { marginBottom: theme.spacing.md }]}>
            <Text style={styles.summaryLabel}>Khuyến mãi:</Text>
            <Text style={styles.summaryDiscount}>
              -{promotionTotal.toLocaleString("vi-VN")} đ
            </Text>
          </View>

          {/* TOTAL */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>
              {totalAmount.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          {deposit > 0 && (
            <View style={styles.depositRow}>
              <Text style={styles.depositLabel}>Còn lại:</Text>
              <Text style={styles.depositValue}>
                {(totalAmount - deposit).toLocaleString("vi-VN")} đ
              </Text>
            </View>
          )}
        </Card>

        <Button
          title="Tạo đơn hàng"
          variant="primary"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          style={styles.submitButton}
        />
      </ScrollView>

      {/* Modals (Giữ nguyên) */}
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
    </SafeAreaView>
  );
};

// Styles (Cập nhật Summary Styles)
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
    paddingBottom: theme.spacing["3xl"],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  picker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  pickerContent: {
    flex: 1,
  },
  pickerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
  },
  pickerSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  pickerPlaceholder: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textTertiary,
  },
  pickerDisabled: {
    color: theme.colors.textTertiary,
  },
  pickerContainer: {
    marginBottom: theme.spacing.md,
  },
  pickerLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  paymentMethods: {
    gap: theme.spacing.sm,
  },
  paymentMethod: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedPayment: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "10",
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  paymentText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  selectedPaymentText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  depositInfo: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary + "10",
    borderRadius: theme.borderRadius.md,
  },
  depositText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  itemCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  itemTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  // === SUMMARY STYLES ===
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  summaryDiscount: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.error,
  },
  // === TOTAL STYLES ===
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  depositRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  depositLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  depositValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  // Modal Styles (Giữ nguyên)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: "80%",
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  modalItemSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  colorSwatchSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  colorPickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
});

export default CreateOrderScreen;
