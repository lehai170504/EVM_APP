import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { orderService } from "../../services/orderService";
import { deliveryService } from "../../services/deliveryService";
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
  isOrderAllocated,
  delivery,
}) => {
  if (!isOrderAllocated || delivery) return null;

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

      <TextInput
        style={styles.textInput}
        placeholder="Thời gian dự kiến (VD: 2025-12-27T09:00:00Z)"
        value={deliveryForm.scheduledAt}
        onChangeText={(text) =>
          setDeliveryForm((prev) => ({ ...prev, scheduledAt: text }))
        }
      />

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
        onPress={handleCreateDelivery}
        style={{ marginTop: theme.spacing.md }}
        disabled={!deliveryForm.address.trim()}
      />
    </Card>
  );
};

/* ------------------- MÀN HÌNH CHÍNH ------------------- */
const OrderDetailScreen = ({ route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryForm, setDeliveryForm] = useState({
    address: "",
    scheduledAt: "",
    notes: "",
  });

  /* --- LOAD DỮ LIỆU --- */
  const loadOrderAndDelivery = useCallback(async () => {
    setLoading(true);
    try {
      const [orderData, deliveries] = await Promise.all([
        orderService.getOrderById(orderId),
        deliveryService.getDeliveries(orderId),
      ]);

      setOrder(orderData);
      setDelivery(deliveries?.[0] || null);

      // Prefill form từ order (nếu chưa có)
      setDeliveryForm((prev) => ({
        ...prev,
        address: prev.address || orderData.customer?.address || "",
        scheduledAt: prev.scheduledAt || orderData.expectedDelivery || "",
      }));
    } catch (error) {
      console.error("Load data error:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết đơn hàng hoặc giao hàng.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderAndDelivery();
  }, [loadOrderAndDelivery]);

  /* --- TẠO GIAO HÀNG MỚI --- */
  const handleCreateDelivery = async () => {
    if (!order?._id) return;

    const { address, scheduledAt, notes } = deliveryForm;
    if (!address.trim()) {
      Alert.alert("Thông báo", "Địa chỉ giao hàng là bắt buộc.");
      return;
    }

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
              Alert.alert("Thành công", "Đã tạo giao hàng thành công.");
              setDelivery(newDelivery);
              // Reload lại để sync thông tin mới
              await loadOrderAndDelivery();
            } catch (error) {
              console.error("Create delivery error:", error);
              const msg =
                error.response?.data?.message ||
                "Không thể tạo giao hàng. Vui lòng thử lại.";
              Alert.alert("Lỗi", msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /* --- CẬP NHẬT TRẠNG THÁI GIAO HÀNG --- */
  const handleUpdateDeliveryStatus = async (newStatus) => {
    if (!delivery) return;

    const validTransitions = {
      pending: "in_progress",
      in_progress: "delivered",
    };

    if (validTransitions[delivery.status] !== newStatus) {
      Alert.alert("Cảnh báo", "Không thể chuyển trạng thái này.");
      return;
    }

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
              console.error("Update delivery status error:", error);
              const msg =
                error.response?.data?.message ||
                "Không thể cập nhật trạng thái.";
              Alert.alert("Lỗi", msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /* --- LOADING --- */
  if (loading) return <Loading />;

  if (!order)
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Không tìm thấy đơn hàng.
        </Text>
      </SafeAreaView>
    );

  /* --- EXTRACT DỮ LIỆU --- */
  const { dealer, customer, items, paymentMethod, deposit, status } = order;
  const isOrderAllocated = status === "allocated";
  const totalAmount =
    order.totalAmount ||
    items?.reduce(
      (sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.qty) || 0),
      0
    ) ||
    0;

  const expectedDeliveryDate = order.expectedDelivery
    ? format(new Date(order.expectedDelivery), "dd/MM/yyyy HH:mm")
    : "Chưa xác định";

  /* --- RENDER --- */
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
              Đơn hàng #{order.orderNo || order._id?.slice(-6)}
            </Text>
            <StatusBadge status={status} />
          </View>

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
                {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
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
          {items?.map((item, index) => {
            const subtotal =
              (Number(item.unitPrice) || 0) * (Number(item.qty) || 0);
            return (
              <View
                key={index}
                style={[
                  styles.itemRow,
                  index === items.length - 1 && styles.lastItemRow,
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
                    {item.unitPrice?.toLocaleString("vi-VN")} đ x {item.qty}
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
              {totalAmount.toLocaleString("vi-VN")} đ
            </Text>
          </View>

          {deposit > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Đặt cọc:</Text>
              <Text style={styles.summaryValue}>
                {deposit.toLocaleString("vi-VN")} đ
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phương thức thanh toán:</Text>
            <Text style={styles.summaryValue}>
              {paymentMethod === "cash" ? "Tiền mặt" : "Trả góp"}
            </Text>
          </View>
        </Card>

        {/* FORM TẠO DELIVERY */}
        <DeliveryFormSection
          deliveryForm={deliveryForm}
          setDeliveryForm={setDeliveryForm}
          handleCreateDelivery={handleCreateDelivery}
          isOrderAllocated={isOrderAllocated}
          delivery={delivery}
        />

        {/* NÚT CẬP NHẬT TRẠNG THÁI GIAO HÀNG */}
        {delivery && (
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
    fontSize: theme.typography.fontSize.base,
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
