import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '../../services/orderService';
import { deliveryService } from '../../services/deliveryService';
import { paymentService } from '../../services/paymentService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { format } from 'date-fns';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    loadDeliveries();
    loadPayments();
  }, []);

  const loadOrder = async () => {
    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Load order error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async () => {
    try {
      const data = await deliveryService.getDeliveries(orderId);
      setDeliveries(data);
    } catch (error) {
      console.error('Load deliveries error:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const data = await paymentService.getPayments(orderId);
      setPayments(data);
    } catch (error) {
      console.error('Load payments error:', error);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      alert('Cập nhật trạng thái thành công');
      loadOrder();
    } catch (error) {
      alert('Cập nhật thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading || !order) {
    return <Loading />;
  }

  const customerName =
    typeof order.customer === 'object'
      ? order.customer?.fullName || order.customer?.name
      : 'N/A';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>Đơn hàng #{order.orderNo || order._id.slice(-6)}</Text>
            <StatusBadge status={order.status} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khách hàng</Text>
            <Text style={styles.sectionValue}>{customerName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ngày tạo</Text>
            <Text style={styles.sectionValue}>
              {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <Text style={styles.sectionValue}>
              {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Trả góp'}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Chi tiết sản phẩm</Text>
          {order.items?.map((item, index) => {
            const variantName = typeof item.variant === 'object' ? item.variant?.trim : 'N/A';
            return (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{variantName}</Text>
                  <Text style={styles.itemQty}>Số lượng: {item.qty}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {(item.unitPrice * item.qty).toLocaleString('vi-VN')} đ
                </Text>
              </View>
            );
          })}
        </Card>

        <Card>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>
              {order.totalAmount?.toLocaleString('vi-VN') || 0} đ
            </Text>
          </View>
        </Card>

        {(order.status === 'allocated' || order.status === 'invoiced') && (
          <Card>
            <Text style={styles.cardTitle}>Quản lý giao hàng</Text>
            <Button
              title="Tạo phiếu giao hàng"
              variant="primary"
              onPress={() => {
                // Navigate to create delivery screen
                alert('Tạo phiếu giao hàng (cần implement)');
              }}
              fullWidth
              style={styles.actionButton}
            />
          </Card>
        )}

        {order.status === 'delivered' && (
          <Card>
            <Text style={styles.cardTitle}>Thanh toán</Text>
            <Button
              title="Tạo thanh toán"
              variant="success"
              onPress={() => {
                // Navigate to create payment screen
                alert('Tạo thanh toán (cần implement)');
              }}
              fullWidth
              style={styles.actionButton}
            />
          </Card>
        )}

        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <Card>
            <Text style={styles.cardTitle}>Cập nhật trạng thái</Text>
            <View style={styles.statusButtons}>
              {order.status === 'new' && (
                <Button
                  title="Đang xử lý"
                  variant="outline"
                  onPress={() => handleUpdateStatus('processing')}
                  style={styles.statusButton}
                />
              )}
              {(order.status === 'allocated' || order.status === 'invoiced') && (
                <Button
                  title="Đang giao"
                  variant="outline"
                  onPress={() => handleUpdateStatus('delivered')}
                  style={styles.statusButton}
                />
              )}
            </View>
          </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  itemQty: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  itemPrice: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  actionButton: {
    marginTop: theme.spacing.md,
  },
  statusButtons: {
    gap: theme.spacing.sm,
  },
  statusButton: {
    marginBottom: 0,
  },
});

export default OrderDetailScreen;

