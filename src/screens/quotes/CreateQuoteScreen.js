import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { quoteService } from '../../services/quoteService';
import { customerService } from '../../services/customerService';
import { vehicleService } from '../../services/vehicleService';
import { promotionService } from '../../services/promotionService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const CreateQuoteScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [colors, setColors] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState({});
  const [colorModalVisible, setColorModalVisible] = useState({});
  const [promotionModalVisible, setPromotionModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  
  const [items, setItems] = useState([{ variant: '', color: '', qty: 1, unitPrice: 0 }]);
  const [fees, setFees] = useState({ registration: 0, plate: 0, delivery: 0 });
  const [validUntil, setValidUntil] = useState(null);
  const [notes, setNotes] = useState('');
  
  const [subtotal, setSubtotal] = useState(0);
  const [promotionTotal, setPromotionTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Date picker state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [items, fees, selectedPromotion]);

  const loadData = async () => {
    try {
      const [customersData, vehiclesData, colorsData, promotionsData] = await Promise.all([
        customerService.getCustomers(),
        vehicleService.getVehicles(),
        vehicleService.getVehicleColors(),
        promotionService.getPromotions(),
      ]);
      setCustomers(Array.isArray(customersData) ? customersData : (customersData?.data || []));
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.data || []));
      setColors(Array.isArray(colorsData) ? colorsData : (colorsData?.data || []));
      setPromotions(Array.isArray(promotionsData) ? promotionsData : (promotionsData?.data || []));
    } catch (error) {
      console.error('Load data error:', error);
      alert('Tải dữ liệu thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const sub = items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.qty || 0), 0);
    setSubtotal(sub);
    const promoTotal = selectedPromotion ? (selectedPromotion.discountAmount || selectedPromotion.discountPercent ? 
      (selectedPromotion.discountAmount || (sub * (selectedPromotion.discountPercent || 0) / 100)) : 0) : 0;
    setPromotionTotal(promoTotal);
    const totalAmount = sub - promoTotal + (fees.registration || 0) + (fees.plate || 0) + (fees.delivery || 0);
    setTotal(totalAmount);
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
      const quoteData = {
        customer: selectedCustomer._id,
        items: items.map((item) => ({
          variant: item.variant,
          ...(item.color && { color: item.color }),
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
        subtotal,
        discount: 0,
        promotionTotal: promotionTotal || 0,
        fees,
        total,
        ...(validUntil && { validUntil: validUntil.toISOString() }),
        ...(notes.trim() && { notes: notes.trim() }),
      };

      const result = await quoteService.createQuote(quoteData);
      alert('Tạo báo giá thành công');
      navigation.goBack();
    } catch (error) {
      console.error('Create quote error:', error);
      alert('Tạo báo giá thất bại: ' + (error.response?.data?.message || error.message || 'Lỗi không xác định'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateSelect = () => {
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    setValidUntil(date);
    setDatePickerVisible(false);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const renderDatePickerModal = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ngày hết hạn</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.datePickerContent}>
              <View style={styles.datePickerRow}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Năm</Text>
                  <ScrollView style={styles.datePickerList}>
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[styles.datePickerItem, selectedYear === year && styles.datePickerItemSelected]}
                        onPress={() => setSelectedYear(year)}
                      >
                        <Text style={[styles.datePickerItemText, selectedYear === year && styles.datePickerItemTextSelected]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Tháng</Text>
                  <ScrollView style={styles.datePickerList}>
                    {months.map((month) => (
                      <TouchableOpacity
                        key={month}
                        style={[styles.datePickerItem, selectedMonth === month && styles.datePickerItemSelected]}
                        onPress={() => {
                          setSelectedMonth(month);
                          const maxDay = getDaysInMonth(selectedYear, month);
                          if (selectedDay > maxDay) setSelectedDay(maxDay);
                        }}
                      >
                        <Text style={[styles.datePickerItemText, selectedMonth === month && styles.datePickerItemTextSelected]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Ngày</Text>
                  <ScrollView style={styles.datePickerList}>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.datePickerItem, selectedDay === day && styles.datePickerItemSelected]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text style={[styles.datePickerItemText, selectedDay === day && styles.datePickerItemTextSelected]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </ScrollView>
            <View style={styles.datePickerFooter}>
              <Button
                title="Xác nhận"
                variant="primary"
                onPress={handleDateSelect}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderPromotionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedPromotion(item);
        setPromotionModalVisible(false);
      }}
    >
      <View style={styles.modalItemContent}>
        <Text style={styles.modalItemTitle}>{item.name || item.title}</Text>
        <Text style={styles.modalItemSubtitle}>
          {item.discountAmount 
            ? `Giảm ${item.discountAmount.toLocaleString('vi-VN')} đ`
            : item.discountPercent 
            ? `Giảm ${item.discountPercent}%`
            : 'Khuyến mãi'}
        </Text>
      </View>
      {selectedPromotion?._id === item._id && (
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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

        {/* Pricing Section */}
        <Card>
          <Text style={styles.sectionTitle}>Giá và phí</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tạm tính:</Text>
            <Text style={styles.priceValue}>{subtotal.toLocaleString('vi-VN')} đ</Text>
          </View>

          {/* Promotion Picker */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Khuyến mãi</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setPromotionModalVisible(true)}
            >
              <View style={styles.pickerContent}>
                {selectedPromotion ? (
                  <View>
                    <Text style={styles.pickerText}>{selectedPromotion.name || selectedPromotion.title}</Text>
                    <Text style={styles.pickerSubtext}>
                      {selectedPromotion.discountAmount 
                        ? `Giảm ${selectedPromotion.discountAmount.toLocaleString('vi-VN')} đ`
                        : selectedPromotion.discountPercent 
                        ? `Giảm ${selectedPromotion.discountPercent}%`
                        : 'Khuyến mãi'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.pickerPlaceholder}>Chọn khuyến mãi (nếu có)</Text>
                )}
              </View>
              {selectedPromotion && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedPromotion(null);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {promotionTotal > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Khuyến mãi:</Text>
              <Text style={[styles.priceValue, { color: theme.colors.success }]}>
                -{promotionTotal.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          )}

          <Text style={styles.feesLabel}>Phí</Text>
          
          <Input
            label="Phí đăng ký"
            value={fees.registration?.toString()}
            onChangeText={(text) => setFees({ ...fees, registration: parseInt(text) || 0 })}
            keyboardType="numeric"
          />

          <Input
            label="Phí biển số"
            value={fees.plate?.toString()}
            onChangeText={(text) => setFees({ ...fees, plate: parseInt(text) || 0 })}
            keyboardType="numeric"
          />

          <Input
            label="Phí giao hàng"
            value={fees.delivery?.toString()}
            onChangeText={(text) => setFees({ ...fees, delivery: parseInt(text) || 0 })}
            keyboardType="numeric"
          />

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>{total.toLocaleString('vi-VN')} đ</Text>
          </View>
        </Card>

        {/* Additional Info */}
        <Card>
          <Text style={styles.sectionTitle}>Thông tin bổ sung</Text>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Ngày hết hạn</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setDatePickerVisible(true)}
            >
              <View style={styles.pickerContent}>
                {validUntil ? (
                  <Text style={styles.pickerText}>{format(validUntil, 'dd/MM/yyyy')}</Text>
                ) : (
                  <Text style={styles.pickerPlaceholder}>Chọn ngày hết hạn</Text>
                )}
              </View>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.textAreaContainer}>
            <Text style={styles.textAreaLabel}>Ghi chú (tùy chọn)</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Nhập ghi chú (không bắt buộc)..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Card>

        <Button
          title="Tạo báo giá"
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

      {/* Promotion Modal */}
      <Modal
        visible={promotionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPromotionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khuyến mãi</Text>
              <TouchableOpacity onPress={() => setPromotionModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={promotions}
              keyExtractor={(item) => item._id}
              renderItem={renderPromotionItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Không có khuyến mãi</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {renderDatePickerModal()}
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  priceLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  priceValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  feesLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  totalRow: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
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
  textAreaContainer: {
    marginTop: theme.spacing.sm,
  },
  textAreaLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  textArea: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    minHeight: 100,
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
  clearButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  // Date Picker Styles
  datePickerModal: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: theme.spacing.lg,
  },
  datePickerContent: {
    padding: theme.spacing.md,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  datePickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  datePickerLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  datePickerList: {
    maxHeight: 200,
    width: '100%',
  },
  datePickerItem: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginVertical: 2,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  datePickerItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  datePickerItemText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
  },
  datePickerItemTextSelected: {
    color: theme.colors.textWhite,
    fontWeight: theme.typography.fontWeight.bold,
  },
  datePickerFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});

export default CreateQuoteScreen;
