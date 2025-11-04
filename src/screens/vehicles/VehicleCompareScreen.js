import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vehicleService } from '../../services/vehicleService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const VehicleCompareScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [compareData, setCompareData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    // Clear ngay lập tức nếu không đủ điều kiện (ít hơn 2 xe)
    if (selectedIds.length < 2) {
      setCompareData([]);
      return;
    }
    
    // Load khi có ít nhất 2 xe được chọn
    if (selectedIds.length >= 2) {
      loadCompare();
    }
  }, [selectedIds]);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Load vehicles error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompare = async () => {
    // Kiểm tra lại điều kiện trước khi set data
    if (selectedIds.length < 2) {
      setCompareData([]);
      return;
    }
    
    try {
      const data = await vehicleService.compareVehicles(selectedIds);
      // Kiểm tra lại sau khi API trả về (tránh race condition)
      if (selectedIds.length >= 2) {
        setCompareData(data);
      } else {
        setCompareData([]);
      }
    } catch (error) {
      console.error('Compare error:', error);
      setCompareData([]);
    }
  };

  const toggleSelection = (id) => {
    let newSelectedIds;
    if (selectedIds.includes(id)) {
      // Bỏ chọn
      newSelectedIds = selectedIds.filter((item) => item !== id);
    } else {
      // Chọn thêm (không giới hạn số lượng)
      newSelectedIds = [...selectedIds, id];
    }
    
    setSelectedIds(newSelectedIds);
    
    // Clear compare data ngay nếu không đủ 2 xe
    if (newSelectedIds.length < 2) {
      setCompareData([]);
    }
  };

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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="swap-horizontal" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>So sánh xe</Text>
              <Text style={styles.headerSubtitle}>
                Chọn ít nhất 2 xe để so sánh ({selectedIds.length} đã chọn)
              </Text>
            </View>
          </View>
          {selectedIds.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSelectedIds([]);
                setCompareData([]);
              }}
            >
              <Text style={styles.clearButtonText}>Xóa tất cả</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Vehicle List */}
        <View style={styles.vehiclesSection}>
          {vehicles.map((item, index) => {
            const isSelected = selectedIds.includes(item._id);
            const modelName = typeof item.model === 'object' ? item.model?.name : 'N/A';
            
            // Lấy images array
            let imageUrl = null;
            if (item.images && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
              imageUrl = item.images[0];
            } else if (item.model?.images && Array.isArray(item.model.images) && item.model.images.length > 0 && item.model.images[0]) {
              imageUrl = item.model.images[0];
            } else {
              imageUrl = item.img || item.image || item.imageUrl || item.picture || item.model?.img || item.model?.image || item.model?.imageUrl;
            }
            
            return (
              <View key={`${item._id}-${isSelected}`} style={index > 0 && { marginTop: theme.spacing.md }}>
                <TouchableOpacity
                  onPress={() => toggleSelection(item._id)}
                  activeOpacity={0.7}
                >
                  <Card style={[
                    styles.vehicleCard,
                    isSelected && styles.selectedCard
                  ]}>
                    {/* Checkbox */}
                    <View style={styles.checkboxContainer}>
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected
                      ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={18} color={theme.colors.textWhite} />
                        )}
                      </View>
                    </View>
                    
                    {/* Vehicle Image */}
                    <View style={styles.imageContainer}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.vehicleImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Ionicons name="car-outline" size={40} color={theme.colors.textTertiary} />
                        </View>
                      )}
                    </View>
                    
                    {/* Vehicle Info */}
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleModel} numberOfLines={1}>{modelName}</Text>
                      <Text style={styles.vehicleTrim} numberOfLines={1}>{item.trim}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>
                          {item.msrp?.toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                      
                      {/* Quick Specs */}
                      <View style={styles.quickSpecs}>
                        {item.range && (
                          <View style={styles.quickSpecItem}>
                            <Ionicons name="battery-charging" size={12} color={theme.colors.accent} />
                            <Text style={styles.quickSpecText}>{item.range} km</Text>
                          </View>
                        )}
                        {item.motorPower && (
                          <View style={styles.quickSpecItem}>
                            <Ionicons name="flash" size={12} color={theme.colors.warning} />
                            <Text style={styles.quickSpecText}>{item.motorPower} kW</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    {/* Selection Badge */}
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.textWhite} />
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Compare Results */}
        {compareData.length > 0 && selectedIds.length >= 2 && (
          <View style={styles.compareContainer}>
            <View style={styles.compareHeader}>
              <Ionicons name="stats-chart" size={24} color={theme.colors.primary} />
              <Text style={styles.compareTitle}>Kết quả so sánh</Text>
            </View>
            
            <Card style={styles.compareCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.compareTable}>
                  {/* Header Row */}
                  <View style={styles.compareHeaderRow}>
                    <View style={styles.compareHeaderCell}>
                      <Text style={styles.compareHeaderText}>Đặc điểm</Text>
                    </View>
                    {compareData.map((v) => {
                      const modelName = typeof v.model === 'object' ? v.model?.name : 'N/A';
                      return (
                        <View key={v._id} style={styles.compareHeaderCell}>
                          <Text style={styles.compareHeaderValue} numberOfLines={2}>
                            {modelName}
                          </Text>
                          <Text style={styles.compareHeaderSub} numberOfLines={1}>
                            {v.trim}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  
                  {/* Price Row */}
                  <View style={styles.compareRow}>
                    <View style={styles.compareLabelCell}>
                      <Ionicons name="cash" size={16} color={theme.colors.primary} />
                      <Text style={styles.compareLabel}>Giá</Text>
                    </View>
                    {compareData.map((v) => (
                      <View key={v._id} style={styles.compareValueCell}>
                        <Text style={styles.compareValue}>
                          {v.msrp?.toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Range Row */}
                  {compareData.some((v) => v.range) && (
                    <View style={styles.compareRow}>
                      <View style={styles.compareLabelCell}>
                        <Ionicons name="battery-charging" size={16} color={theme.colors.accent} />
                        <Text style={styles.compareLabel}>Tầm hoạt động</Text>
                      </View>
                      {compareData.map((v) => (
                        <View key={v._id} style={styles.compareValueCell}>
                          <Text style={styles.compareValue}>
                            {v.range || 'N/A'} km
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Motor Power Row */}
                  {compareData.some((v) => v.motorPower) && (
                    <View style={styles.compareRow}>
                      <View style={styles.compareLabelCell}>
                        <Ionicons name="flash" size={16} color={theme.colors.warning} />
                        <Text style={styles.compareLabel}>Công suất</Text>
                      </View>
                      {compareData.map((v) => (
                        <View key={v._id} style={styles.compareValueCell}>
                          <Text style={styles.compareValue}>
                            {v.motorPower || 'N/A'} kW
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Battery Row */}
                  {compareData.some((v) => v.battery) && (
                    <View style={styles.compareRow}>
                      <View style={styles.compareLabelCell}>
                        <Ionicons name="battery-full" size={16} color={theme.colors.primary} />
                        <Text style={styles.compareLabel}>Dung lượng pin</Text>
                      </View>
                      {compareData.map((v) => (
                        <View key={v._id} style={styles.compareValueCell}>
                          <Text style={styles.compareValue}>
                            {v.battery || 'N/A'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>
            </Card>
          </View>
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
    paddingBottom: theme.spacing.xl,
  },
  // Header
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  clearButton: {
    alignSelf: 'flex-end',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
  // Vehicles Section
  vehiclesSection: {
    padding: theme.spacing.lg,
  },
  vehicleCard: {
    marginBottom: 0,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '05',
  },
  checkboxContainer: {
    marginRight: theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background + '80',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  vehicleTrim: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  priceContainer: {
    marginBottom: theme.spacing.xs,
  },
  price: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  quickSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  quickSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs / 2,
  },
  quickSpecText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  selectedBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: 4,
  },
  // Compare Section
  compareContainer: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  compareTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  compareCard: {
    overflow: 'hidden',
  },
  compareTable: {
    minWidth: '100%',
  },
  compareHeaderRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '10',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  compareHeaderCell: {
    minWidth: 150,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareHeaderText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  compareHeaderValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs / 2,
  },
  compareHeaderSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  compareRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  compareLabelCell: {
    minWidth: 150,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
  },
  compareLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  compareValueCell: {
    minWidth: 150,
    padding: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default VehicleCompareScreen;

