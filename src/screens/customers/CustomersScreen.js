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
import { customerService } from '../../services/customerService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CustomersScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = customers.filter(
        (c) =>
          c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone?.includes(searchQuery)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Load customers error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const renderCustomer = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('CustomerDetail', { customerId: item._id })}
      >
        <Card style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.fullName}</Text>
              <Text style={styles.customerPhone}>{item.phone}</Text>
              {item.email && (
                <Text style={styles.customerEmail}>{item.email}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
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
        <View style={styles.searchContainer}>
          <Input
            placeholder="Tìm kiếm khách hàng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
        <Button
          title="Thêm khách hàng"
          variant="primary"
          size="md"
          onPress={() => navigation.navigate('CreateCustomer')}
          style={styles.createButton}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>Chưa có khách hàng nào</Text>
            <Button
              title="Thêm khách hàng đầu tiên"
              variant="outline"
              size="md"
              onPress={() => navigation.navigate('CreateCustomer')}
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
  searchContainer: {
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  createButton: {
    marginBottom: 0,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  customerCard: {
    marginBottom: theme.spacing.md,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  customerPhone: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  customerEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
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

export default CustomersScreen;

