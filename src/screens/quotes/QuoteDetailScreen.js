import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { quoteService } from '../../services/quoteService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { format } from 'date-fns';

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
      console.error('Load quote error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToOrder = async () => {
    try {
      if (quote.status !== 'accepted') {
        alert('Chỉ có thể chuyển báo giá đã được chấp nhận thành đơn hàng');
        return;
      }
      await quoteService.convertQuote(quoteId);
      alert('Đã chuyển báo giá thành đơn hàng thành công');
      navigation.goBack();
    } catch (error) {
      alert('Chuyển đổi thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading || !quote) {
    return <Loading />;
  }

  const customerName =
    typeof quote.customer === 'object'
      ? quote.customer?.fullName || quote.customer?.name
      : 'N/A';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>Báo giá #{quote._id.slice(-6)}</Text>
            <StatusBadge status={quote.status} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khách hàng</Text>
            <Text style={styles.sectionValue}>{customerName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ngày tạo</Text>
            <Text style={styles.sectionValue}>
              {format(new Date(quote.createdAt), 'dd/MM/yyyy HH:mm')}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Chi tiết sản phẩm</Text>
          {quote.items?.map((item, index) => {
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
              {quote.total?.toLocaleString('vi-VN') || quote.totalPrice?.toLocaleString('vi-VN') || 0} đ
            </Text>
          </View>
        </Card>

        {quote.status === 'accepted' && (
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
  convertButton: {
    marginTop: theme.spacing.lg,
  },
});

export default QuoteDetailScreen;

