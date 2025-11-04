import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vehicleService } from '../../services/vehicleService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VehicleDetailScreen = ({ route }) => {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicle();
  }, []);

  const loadVehicle = async () => {
    try {
      const data = await vehicleService.getVehicleById(vehicleId);
      setVehicle(data);
    } catch (error) {
      console.error('Load vehicle error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !vehicle) {
    return <Loading />;
  }

  const modelName = typeof vehicle.model === 'object' ? vehicle.model?.name : 'N/A';
  // Lấy images array
  const images = vehicle.images || (vehicle.model?.images || []);
  const mainImage = images.length > 0 ? images[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {mainImage && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: mainImage }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {images.length > 1 && (
              <View style={styles.imageBadge}>
                <Ionicons name="images" size={14} color={theme.colors.textWhite} />
                <Text style={styles.imageCount}>{images.length}</Text>
              </View>
            )}
          </View>
        )}

        {/* Vehicle Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.headerSection}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{modelName}</Text>
              <Text style={styles.subtitle}>{vehicle.trim}</Text>
            </View>
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Giá bán</Text>
              <Text style={styles.price}>
                {vehicle.msrp?.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>
        </Card>

        {/* Technical Specs */}
        {(vehicle.range || vehicle.motorPower || vehicle.battery) && (
          <Card style={styles.specsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            </View>
            
            <View style={styles.specsGrid}>
              {vehicle.range && (
                <View style={styles.specCard}>
                  <View style={[styles.specIconContainer, { backgroundColor: theme.colors.accent + '15' }]}>
                    <Ionicons name="battery-charging" size={24} color={theme.colors.accent} />
                  </View>
                  <Text style={styles.specLabel}>Tầm hoạt động</Text>
                  <Text style={styles.specValue}>{vehicle.range} km</Text>
                </View>
              )}

              {vehicle.motorPower && (
                <View style={styles.specCard}>
                  <View style={[styles.specIconContainer, { backgroundColor: theme.colors.warning + '15' }]}>
                    <Ionicons name="flash" size={24} color={theme.colors.warning} />
                  </View>
                  <Text style={styles.specLabel}>Công suất</Text>
                  <Text style={styles.specValue}>{vehicle.motorPower} kW</Text>
                </View>
              )}

              {vehicle.battery && (
                <View style={styles.specCard}>
                  <View style={[styles.specIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name="battery-full" size={24} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.specLabel}>Dung lượng pin</Text>
                  <Text style={styles.specValue}>{vehicle.battery}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Features */}
        {vehicle.features && vehicle.features.length > 0 && (
          <Card style={styles.featuresCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Tính năng</Text>
            </View>
            <View style={styles.featuresGrid}>
              {vehicle.features.map((feature, index) => (
                <View key={index} style={styles.featureBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Additional Images Gallery */}
        {images.length > 1 && (
          <Card style={styles.galleryCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Hình ảnh</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
              {images.map((img, index) => (
                <View key={index} style={styles.galleryItem}>
                  <Image
                    source={{ uri: img }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
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
    paddingBottom: theme.spacing.xl,
  },
  // Main Image
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.textPrimary + 'CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs / 2,
  },
  imageCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textWhite,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  // Info Card
  infoCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: 0,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
    textTransform: 'uppercase',
  },
  price: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  // Specs Card
  specsCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  specCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadow.sm,
  },
  specIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  specLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
    textAlign: 'center',
  },
  specValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  // Features Card
  featuresCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: 0,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs / 2,
  },
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  // Gallery Card
  galleryCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: 0,
  },
  galleryScroll: {
    marginTop: theme.spacing.md,
  },
  galleryItem: {
    width: 120,
    height: 120,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
});

export default VehicleDetailScreen;

