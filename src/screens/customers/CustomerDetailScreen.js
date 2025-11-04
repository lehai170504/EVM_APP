import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customerService } from '../../services/customerService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { theme } from '../../theme';
import { format } from 'date-fns';

const CustomerDetailScreen = ({ route }) => {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      const data = await customerService.getCustomerById(customerId);
      setCustomer(data);
    } catch (error) {
      console.error('Load customer error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !customer) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.title}>{customer.fullName}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Số điện thoại</Text>
            <Text style={styles.sectionValue}>{customer.phone}</Text>
          </View>

          {customer.email && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email</Text>
              <Text style={styles.sectionValue}>{customer.email}</Text>
            </View>
          )}

          {customer.address && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Địa chỉ</Text>
              <Text style={styles.sectionValue}>{customer.address}</Text>
            </View>
          )}

          {customer.segment && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phân khúc</Text>
              <Text style={styles.sectionValue}>
                {customer.segment === 'retail' ? 'Bán lẻ' : 'Bán sỉ'}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ngày tạo</Text>
            <Text style={styles.sectionValue}>
              {format(new Date(customer.createdAt), 'dd/MM/yyyy')}
            </Text>
          </View>
        </Card>

        {customer.notes && (
          <Card>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <Text style={styles.sectionValue}>{customer.notes}</Text>
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
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
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
});

export default CustomerDetailScreen;

