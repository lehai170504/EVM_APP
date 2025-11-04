import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { quoteService } from "../../services/quoteService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import theme from "../../theme";
import { format } from "date-fns";

const QuoteDetailScreen = ({ route, navigation }) => {
  const { quoteId } = route.params;
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, []);

  const loadQuote = async () => {
    try {
      const data = await quoteService.getQuoteById(quoteId);
      setQuote(data);
    } catch (error) {
      console.error("Load quote error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToOrder = async () => {
    try {
      if (quote.status !== "accepted") {
        Alert.alert(
          "Lỗi",
          "Chỉ có thể chuyển báo giá đã được chấp nhận thành đơn hàng"
        );
        return;
      }

      // Chuẩn bị dữ liệu ban đầu cho màn hình tạo đơn hàng
      const initialOrderData = {
        // Truyền object khách hàng đầy đủ nếu có
        customer: quote.customer,
        paymentMethod: quote.paymentMethod || "cash",
        deposit: quote.deposit || 0,
        notes: quote.notes,
        // Truyền đầy đủ object variant/color để màn hình CreateOrder có thể tự động chọn
        items: quote.items.map((item) => ({
          variant: item.variant, // object đầy đủ
          color: item.color, // object đầy đủ
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
        discount: quote.discount || 0,
        promotionTotal: quote.promotionTotal || 0,
        fees: quote.fees || {},
        subtotal: quote.subtotal || 0,
        total: quote.total || 0,
      };

      // Gọi API chuyển đổi báo giá (giả định đây là API cập nhật status)
      await quoteService.convertQuote(quoteId);

      Alert.alert("Thành công", "Đã chuyển báo giá thành đơn hàng thành công");

      navigation.navigate("CreateOrder", { initialData: initialOrderData });

      // **Đã xóa navigation.goBack() ở đây để ở lại màn hình CreateOrder**
    } catch (error) {
      Alert.alert(
        "Chuyển đổi thất bại",
        error.response?.data?.message || error.message
      );
    }
  };

  if (loading || !quote) {
    return <Loading />;
  }

  const customer = quote.customer || {};
  const dealer = quote.dealer || {};
  const fees = quote.fees || {};

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* -------- Header -------- */}
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>Báo giá #{quote._id.slice(-6)}</Text>
            <StatusBadge status={quote.status} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khách hàng</Text>
            <Text style={styles.sectionValue}>{customer.fullName}</Text>
            <Text style={styles.sectionSub}>{customer.phone}</Text>
            <Text style={styles.sectionSub}>{customer.email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đại lý</Text>
            <Text style={styles.sectionValue}>{dealer.name}</Text>
            <Text style={styles.sectionSub}>Khu vực: {dealer.region}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ngày tạo</Text>
            <Text style={styles.sectionValue}>
              {format(new Date(quote.createdAt), "dd/MM/yyyy HH:mm")}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hiệu lực đến</Text>
            <Text style={styles.sectionValue}>
              {format(new Date(quote.validUntil), "dd/MM/yyyy HH:mm")}
            </Text>
          </View>
        </Card>

        {/* -------- Items -------- */}
        <Card>
          <Text style={styles.cardTitle}>Chi tiết sản phẩm</Text>
          {quote.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.variant?.trim || item.variant?.name || "Không rõ"}
                </Text>
                <Text style={styles.itemSub}>
                  Màu: {item.color?.name} ({item.color?.code})
                </Text>
                <Text style={styles.itemSub}>Số lượng: {item.qty}</Text>
                <Text style={styles.itemSub}>
                  Đơn giá: {item.unitPrice?.toLocaleString("vi-VN")} đ
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {(item.unitPrice * item.qty).toLocaleString("vi-VN")} đ
              </Text>
            </View>
          ))}
        </Card>

        {/* -------- Fees -------- */}
        <Card>
          <Text style={styles.cardTitle}>Phí liên quan</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Đăng ký:</Text>
            <Text style={styles.feeValue}>
              {fees.registration?.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Biển số:</Text>
            <Text style={styles.feeValue}>
              {fees.plate?.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Giao xe:</Text>
            <Text style={styles.feeValue}>
              {fees.delivery?.toLocaleString("vi-VN")} đ
            </Text>
          </View>
        </Card>

        {/* -------- Summary -------- */}
        <Card>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tạm tính:</Text>
            <Text style={styles.totalValue}>
              {quote.subtotal?.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Giảm giá:</Text>
            <Text style={styles.discountValue}>
              -{quote.discount?.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Khuyến mãi:</Text>
            <Text style={styles.discountValue}>
              -{quote.promotionTotal?.toLocaleString("vi-VN")} đ
            </Text>
          </View>
          <View style={[styles.totalRow, { marginTop: theme.spacing.md }]}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalGrand}>
              {quote.total?.toLocaleString("vi-VN")} đ
            </Text>
          </View>
        </Card>

        {/* -------- Notes -------- */}
        {quote.notes ? (
          <Card>
            <Text style={styles.cardTitle}>Ghi chú</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </Card>
        ) : null}

        {/* -------- Button -------- */}
        {quote.status === "accepted" && (
          <Button
            title="Chuyển thành đơn hàng"
            variant="primary"
            onPress={handleConvertToOrder}
            fullWidth
            style={styles.convertButton}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
  },
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
  section: {
    marginBottom: theme.spacing.md,
  },
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
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  itemSub: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  itemPrice: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  feeLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  feeValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  discountValue: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.error,
  },
  totalGrand: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  notesText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  convertButton: {
    marginTop: theme.spacing.lg,
  },
});

export default QuoteDetailScreen;
