import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '../../services/orderService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const renderOrder = ({ item }) => {
    const customerName =
      typeof item.customer === 'object'
        ? item.customer?.fullName || item.customer?.name
        : 'N/A';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
      >
        <Card style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNo}>#{item.orderNo || item._id.slice(-6)}</Text>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.orderDate}>
                {format(new Date(item.createdAt), 'dd/MM/yyyy')}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>

          <View style={styles.orderDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tổng tiền:</Text>
              <Text style={styles.totalValue}>
                {item.totalAmount?.toLocaleString('vi-VN') || 0} đ
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phương thức:</Text>
              <Text style={styles.detailValue}>
                {item.paymentMethod === 'cash' ? 'Tiền mặt' : 'Trả góp'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Button
          title="Tạo đơn hàng mới"
          variant="primary"
          size="md"
          onPress={() => navigation.navigate('CreateOrder')}
          style={styles.createButton}
        />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            <Button
              title="Tạo đơn hàng đầu tiên"
              variant="outline"
              size="md"
              onPress={() => navigation.navigate('CreateOrder')}
              style={styles.emptyButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  createButton: {
    marginBottom: 0,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  orderCard: {
    marginBottom: theme.spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderNo: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  customerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  orderDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  orderDetails: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['5xl'],
  },
  emptyText: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  emptyButton: {
    marginTop: theme.spacing.md,
  },
});

export default OrdersScreen;

