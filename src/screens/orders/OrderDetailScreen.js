import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Platform,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { orderService } from "../../services/orderService";
import { deliveryService } from "../../services/deliveryService";
import { paymentService } from "../../services/paymentService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { format } from "date-fns";

/* ------------------- FORM TẠO GIAO HÀNG ------------------- */
const DeliveryFormSection = ({
  deliveryForm,
  setDeliveryForm,
  handleCreateDelivery,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === "android") setShowPicker(false); // đóng picker
    if (selectedDate) {
      setDeliveryForm((prev) => ({
        ...prev,
        scheduledAt: selectedDate.toISOString(),
      }));
    }
  };

  return (
    <Card>
      <Text style={styles.cardTitle}>Tạo giao hàng mới</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Địa chỉ giao hàng"
        value={deliveryForm.address}
        onChangeText={(text) =>
          setDeliveryForm((prev) => ({ ...prev, address: text }))
        }
      />

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={[styles.textInput, { justifyContent: "center" }]}
      >
        <Text style={{ color: deliveryForm.scheduledAt ? "#000" : "#999" }}>
          {deliveryForm.scheduledAt
            ? format(new Date(deliveryForm.scheduledAt), "dd/MM/yyyy HH:mm")
            : "Chọn thời gian dự kiến"}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={
            deliveryForm.scheduledAt
              ? new Date(deliveryForm.scheduledAt)
              : new Date()
          }
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      <TextInput
        style={styles.textInput}
        placeholder="Ghi chú"
        value={deliveryForm.notes}
        onChangeText={(text) =>
          setDeliveryForm((prev) => ({ ...prev, notes: text }))
        }
      />
      <Button
        title="Tạo giao hàng"
        variant="primary"
        fullWidth
        style={{ marginTop: theme.spacing.md }}
        onPress={handleCreateDelivery}
        disabled={!deliveryForm.address.trim()}
      />
    </Card>
  );
};

/* ------------------- MAIN SCREEN ------------------- */
const OrderDetailScreen = ({ route }) => {
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryForm, setDeliveryForm] = useState({
    address: "",
    scheduledAt: "",
    notes: "",
  });
  const [latestDelivery, setLatestDelivery] = useState(null);

  /* --- LOAD DATA --- */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [orderData, deliveries, paymentData] = await Promise.all([
        orderService.getOrderById(orderId),
        deliveryService.getDeliveries(orderId),
        paymentService.getPayments(orderId),
      ]);

      setOrder(orderData);
      setPayments(paymentData || []);

      // Lấy delivery mới nhất (theo createdAt)
      const latestDelivery =
        deliveries?.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0] || null;
      setDelivery(latestDelivery);

      // Khởi tạo form
      setDeliveryForm((prev) => ({
        ...prev,
        address: prev.address || orderData.customer?.address || "",
        scheduledAt: prev.scheduledAt || orderData.expectedDelivery || "",
      }));
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* --- CREATE DELIVERY --- */
  const handleCreateDelivery = async () => {
    if (!order?._id) return;
    const { address, scheduledAt, notes } = deliveryForm;
    if (!address.trim())
      return Alert.alert("Thông báo", "Địa chỉ giao hàng là bắt buộc.");

    const payload = {
      order: order._id,
      address,
      scheduledAt: scheduledAt || undefined,
      notes: notes || undefined,
    };
    Alert.alert(
      "Xác nhận tạo giao hàng",
      `Địa chỉ: ${payload.address}\nThời gian: ${
        payload.scheduledAt || "Không có"
      }`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              setLoading(true);
              const newDelivery = await deliveryService.createDelivery(payload);
              setDelivery(newDelivery);
              Alert.alert("Thành công", "Đã tạo giao hàng thành công.");

              setDeliveryForm({ address: "", scheduledAt: "", notes: "" });
            } catch (error) {
              console.error(error);
              Alert.alert("Lỗi", "Không thể tạo giao hàng. Vui lòng thử lại.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /* --- UPDATE DELIVERY STATUS --- */
  const handleUpdateDeliveryStatus = async (newStatus) => {
    if (!delivery) return;
    const validTransitions = {
      pending: "in_progress",
      in_progress: "delivered",
    };
    if (validTransitions[delivery.status] !== newStatus)
      return Alert.alert("Cảnh báo", "Không thể chuyển trạng thái này.");

    Alert.alert(
      "Xác nhận cập nhật",
      `Chuyển trạng thái sang: ${newStatus.toUpperCase()}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: async () => {
            try {
              setLoading(true);
              const updated = await deliveryService.updateDeliveryStatus(
                delivery._id,
                newStatus
              );
              setDelivery(updated);
              Alert.alert(
                "Thành công",
                `Trạng thái đã được cập nhật: ${newStatus.toUpperCase()}`
              );
            } catch (error) {
              console.error(error);
              Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /* --- INVOICE ORDER --- */
  const handleInvoiceOrder = async () => {
    if (!order?._id) return;
    Alert.alert("Xác nhận", "Bạn có chắc muốn xuất hóa đơn cho đơn hàng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xác nhận",
        onPress: async () => {
          try {
            setLoading(true);
            const updatedOrder = await orderService.updateOrderStatus(
              order._id,
              "invoiced"
            );
            setOrder(updatedOrder);
            Alert.alert("Thành công", "Đơn hàng đã được xuất hóa đơn.");
          } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể xuất hóa đơn.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) return <Loading />;
  if (!order)
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Không tìm thấy đơn hàng.
        </Text>
      </SafeAreaView>
    );

  const {
    dealer,
    customer,
    items,
    paymentMethod,
    deposit,
    status,
    totalAmount,
    expectedDelivery,
    createdAt,
    orderNo,
  } = order;
  const total =
    totalAmount ||
    items?.reduce(
      (sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.qty) || 0),
      0
    ) ||
    0;
  const expectedDeliveryDate = expectedDelivery
    ? format(new Date(expectedDelivery), "dd/MM/yyyy HH:mm")
    : "Chưa xác định";
  const showDeliveryForm = status === "allocated";
  const canInvoiceOrder = status === "allocated";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* THÔNG TIN CHUNG */}
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>
              Đơn hàng #{orderNo || order._id?.slice(-6)}
            </Text>
            <StatusBadge status={status} />
          </View>

          {canInvoiceOrder && (
            <Button
              title="Xuất hóa đơn"
              variant="primary"
              fullWidth
              style={{ marginBottom: theme.spacing.md }}
              onPress={handleInvoiceOrder}
            />
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khách hàng</Text>
            <Text style={styles.sectionValue}>{customer?.fullName}</Text>
            <Text style={styles.sectionSub}>{customer?.phone}</Text>
            <Text style={styles.sectionSub}>{customer?.email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đại lý</Text>
            <Text style={styles.sectionValue}>{dealer?.name || "N/A"}</Text>
            <Text style={styles.sectionSub}>{dealer?.address}</Text>
          </View>

          <View style={styles.rowSection}>
            <View style={styles.colHalf}>
              <Text style={styles.sectionTitle}>Ngày tạo</Text>
              <Text style={styles.sectionValue}>
                {format(new Date(createdAt), "dd/MM/yyyy HH:mm")}
              </Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.sectionTitle}>Giao hàng dự kiến</Text>
              <Text style={styles.sectionValue}>{expectedDeliveryDate}</Text>
            </View>
          </View>
        </Card>

        {/* CHI TIẾT SẢN PHẨM */}
        <Card>
          <Text style={styles.cardTitle}>Chi tiết sản phẩm</Text>
          {items?.map((item, idx) => {
            const subtotal =
              (Number(item.unitPrice) || 0) * (Number(item.qty) || 0);
            return (
              <View
                key={idx}
                style={[
                  styles.itemRow,
                  idx === items.length - 1 && styles.lastItemRow,
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {item.variant?.trim || "N/A"}
                  </Text>
                  {item.color?.name && (
                    <Text style={styles.itemColor}>Màu: {item.color.name}</Text>
                  )}
                  <Text style={styles.itemQty}>
                    {(item.unitPrice || 0).toLocaleString("vi-VN")} đ x{" "}
                    {item.qty}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {subtotal.toLocaleString("vi-VN")} đ
                </Text>
              </View>
            );
          })}
        </Card>

        {/* TỔNG KẾT THANH TOÁN */}
        <Card>
          <Text style={styles.cardTitle}>Tổng kết thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng cộng:</Text>
            <Text style={styles.summaryValue}>
              {total.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          {deposit > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Đặt cọc:</Text>
              <Text style={[styles.summaryValue, { color: "#FF9500" }]}>
                {deposit.toLocaleString("vi-VN")} đ
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Còn phải thanh toán:</Text>
            <Text
              style={[styles.summaryValue, { color: theme.colors.primary }]}
            >
              {(total - deposit).toLocaleString("vi-VN")} đ
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phương thức thanh toán:</Text>
            <Text style={styles.summaryValue}>
              {paymentMethod === "cash" ? "Tiền mặt" : "Trả góp"}
            </Text>
          </View>
        </Card>

        {/* FORM GIAO HÀNG */}
        {showDeliveryForm && (
          <DeliveryFormSection
            deliveryForm={deliveryForm}
            setDeliveryForm={setDeliveryForm}
            handleCreateDelivery={handleCreateDelivery}
          />
        )}

        {/* HIỂN THỊ TRẠNG THÁI GIAO HÀNG — CHỈ KHI ĐÃ TẠO DELIVERY */}
        {delivery?._id && (
          <Card>
            <Text style={styles.cardTitle}>Trạng thái giao hàng</Text>
            <StatusBadge status={delivery.status} />

            {delivery.status === "pending" && (
              <Button
                title="Bắt đầu giao hàng"
                variant="secondary"
                fullWidth
                style={{ marginTop: theme.spacing.md }}
                onPress={() => handleUpdateDeliveryStatus("in_progress")}
              />
            )}

            {delivery.status === "in_progress" && (
              <Button
                title="Đánh dấu đã giao"
                variant="primary"
                fullWidth
                style={{ marginTop: theme.spacing.md }}
                onPress={() => handleUpdateDeliveryStatus("delivered")}
              />
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/* ------------------- STYLES ------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: theme.spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  section: { marginBottom: theme.spacing.md },
  rowSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  colHalf: { flex: 1 },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  sectionValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  sectionSub: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastItemRow: { borderBottomWidth: 0 },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  itemColor: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemQty: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.base,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
  },
});

export default OrderDetailScreen;
