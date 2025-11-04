import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '../../services/orderService';
import { customerService } from '../../services/customerService';
import { vehicleService } from '../../services/vehicleService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const CreateOrderScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState({});
  const [colorModalVisible, setColorModalVisible] = useState({});
  
  const [items, setItems] = useState([{ variant: '', color: '', qty: 1, unitPrice: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deposit, setDeposit] = useState(0);
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [items]);

  const loadData = async () => {
    try {
      const [customersData, vehiclesData, colorsData] = await Promise.all([
        customerService.getCustomers(),
        vehicleService.getVehicles(),
        vehicleService.getVehicleColors(),
      ]);
      setCustomers(Array.isArray(customersData) ? customersData : (customersData?.data || []));
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.data || []));
      setColors(Array.isArray(colorsData) ? colorsData : (colorsData?.data || []));
    } catch (error) {
      console.error('Load data error:', error);
      alert('Tải dữ liệu thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const total = items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.qty || 0), 0);
    setTotalAmount(total);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'variant') {
      const vehicle = vehicles.find((v) => v._id === value);
      if (vehicle) {
        newItems[index].unitPrice = vehicle.msrp || 0;
        newItems[index].color = ''; // Reset color when variant changes
      }
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { variant: '', color: '', qty: 1, unitPrice: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      alert('Vui lòng chọn khách hàng');
      return;
    }

    if (items.some((item) => !item.variant || item.qty <= 0 || item.unitPrice <= 0)) {
      alert('Vui lòng điền đầy đủ thông tin sản phẩm');
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
      };

      await orderService.createOrder(orderData);
      alert('Tạo đơn hàng thành công');
      navigation.goBack();
    } catch (error) {
      console.error('Create order error:', error);
      alert('Tạo đơn hàng thất bại: ' + (error.response?.data?.message || error.message || 'Lỗi không xác định'));
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text style={styles.modalItemSubtitle}>{item.phone} • {item.email}</Text>
      </View>
      {selectedCustomer?._id === item._id && (
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderVariantItem = ({ item }, itemIndex) => {
    const modelName = typeof item.model === 'object' ? item.model?.name : 'N/A';
    return (
      <TouchableOpacity
        style={styles.modalItem}
        onPress={() => {
          updateItem(itemIndex, 'variant', item._id);
          setVariantModalVisible({ ...variantModalVisible, [itemIndex]: false });
        }}
      >
        <View style={styles.modalItemContent}>
          <Text style={styles.modalItemTitle}>{modelName} - {item.trim}</Text>
          <Text style={styles.modalItemSubtitle}>
            {item.msrp?.toLocaleString('vi-VN')} đ
            {item.range && ` • ${item.range} km`}
            {item.motorPower && ` • ${item.motorPower} kW`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderColorItem = ({ item }, itemIndex) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        updateItem(itemIndex, 'color', item._id);
        setColorModalVisible({ ...colorModalVisible, [itemIndex]: false });
      }}
    >
      <View style={[styles.colorSwatch, { backgroundColor: item.hex || '#ccc' }]} />
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemTitle}>{item.name}</Text>
        {item.extraPrice > 0 && (
          <Text style={styles.modalItemSubtitle}>+{item.extraPrice.toLocaleString('vi-VN')} đ</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
                  <Text style={styles.pickerText}>{selectedCustomer.fullName}</Text>
                  <Text style={styles.pickerSubtext}>{selectedCustomer.phone}</Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>Chọn khách hàng</Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Payment Method */}
        <Card>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'cash' && styles.selectedPayment,
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={styles.paymentMethodContent}>
                <Ionicons 
                  name="cash-outline" 
                  size={24} 
                  color={paymentMethod === 'cash' ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.paymentText,
                  paymentMethod === 'cash' && styles.selectedPaymentText
                ]}>Tiền mặt</Text>
              </View>
              {paymentMethod === 'cash' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'finance' && styles.selectedPayment,
              ]}
              onPress={() => setPaymentMethod('finance')}
            >
              <View style={styles.paymentMethodContent}>
                <Ionicons 
                  name="card-outline" 
                  size={24} 
                  color={paymentMethod === 'finance' ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.paymentText,
                  paymentMethod === 'finance' && styles.selectedPaymentText
                ]}>Trả góp</Text>
              </View>
              {paymentMethod === 'finance' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Deposit */}
        <Card>
          <Text style={styles.sectionTitle}>Tiền đặt cọc</Text>
          <Input
            label="Số tiền đặt cọc (tùy chọn)"
            value={deposit?.toString()}
            onChangeText={(text) => setDeposit(parseInt(text.replace(/\./g, '')) || 0)}
            keyboardType="numeric"
            placeholder="0"
          />
          {deposit > 0 && (
            <View style={styles.depositInfo}>
              <Text style={styles.depositText}>
                Đã đặt cọc: {deposit.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          )}
        </Card>

        {/* Items Section */}
        <Card>
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm</Text>
            <TouchableOpacity onPress={addItem} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {items.map((item, index) => {
            const selectedVehicle = vehicles.find((v) => v._id === item.variant);
            const selectedColor = colors.find((c) => c._id === item.color);
            const modelName = selectedVehicle
              ? typeof selectedVehicle.model === 'object'
                ? selectedVehicle.model?.name
                : 'N/A'
              : 'Chọn mẫu xe';

            return (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Sản phẩm {index + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(index)}>
                      <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Variant Picker */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Mẫu xe *</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setVariantModalVisible({ ...variantModalVisible, [index]: true })}
                  >
                    <View style={styles.pickerContent}>
                      <Text style={styles.pickerText}>
                        {modelName} {selectedVehicle?.trim ? `- ${selectedVehicle.trim}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Color Picker */}
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Màu sắc</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setColorModalVisible({ ...colorModalVisible, [index]: true })}
                    disabled={!item.variant}
                  >
                    <View style={styles.pickerContent}>
                      {selectedColor ? (
                        <View style={styles.colorPickerContent}>
                          <View style={[styles.colorSwatchSmall, { backgroundColor: selectedColor.hex || '#ccc' }]} />
                          <Text style={styles.pickerText}>{selectedColor.name}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.pickerPlaceholder, !item.variant && styles.pickerDisabled]}>
                          {item.variant ? 'Chọn màu sắc' : 'Chọn mẫu xe trước'}
                        </Text>
                      )}
                    </View>
                    <Ionicons 
                      name="chevron-down" 
                      size={20} 
                      color={!item.variant ? theme.colors.textTertiary : theme.colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Quantity */}
                <Input
                  label="Số lượng *"
                  value={item.qty?.toString()}
                  onChangeText={(text) => updateItem(index, 'qty', parseInt(text) || 0)}
                  keyboardType="numeric"
                />

                {/* Unit Price */}
                <Input
                  label="Đơn giá *"
                  value={item.unitPrice?.toLocaleString('vi-VN')}
                  onChangeText={(text) =>
                    updateItem(index, 'unitPrice', parseInt(text.replace(/\./g, '')) || 0)
                  }
                  keyboardType="numeric"
                />
              </View>
            );
          })}
        </Card>

        {/* Total */}
        <Card>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>{totalAmount.toLocaleString('vi-VN')} đ</Text>
          </View>
          {deposit > 0 && (
            <View style={styles.depositRow}>
              <Text style={styles.depositLabel}>Còn lại:</Text>
              <Text style={styles.depositValue}>
                {(totalAmount - deposit).toLocaleString('vi-VN')} đ
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
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
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
          onRequestClose={() => setVariantModalVisible({ ...variantModalVisible, [index]: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn mẫu xe</Text>
                <TouchableOpacity onPress={() => setVariantModalVisible({ ...variantModalVisible, [index]: false })}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
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
          onRequestClose={() => setColorModalVisible({ ...colorModalVisible, [index]: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn màu sắc</Text>
                <TouchableOpacity onPress={() => setColorModalVisible({ ...colorModalVisible, [index]: false })}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
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
    paddingBottom: theme.spacing['3xl'],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedPayment: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.md,
  },
  depositText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  itemTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
});

export default CreateOrderScreen;
