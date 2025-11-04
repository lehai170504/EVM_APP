import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vehicleService } from '../../services/vehicleService';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const VehiclesScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Load vehicles error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles();
  };

  const renderVehicle = ({ item }) => {
    const modelName = typeof item.model === 'object' ? item.model?.name : 'N/A';
    // Lấy image từ nhiều nguồn có thể (ưu tiên images array)
    let imageUrl = null;
    if (item.images && Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
      imageUrl = item.images[0];
    } else if (item.model?.images && Array.isArray(item.model.images) && item.model.images.length > 0 && item.model.images[0]) {
      imageUrl = item.model.images[0];
    } else {
      imageUrl = item.img || item.image || item.imageUrl || item.picture || item.model?.img || item.model?.image || item.model?.imageUrl;
    }
    
    return (
      <Card style={styles.vehicleCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item._id })}
          style={styles.cardContent}
        >
          {/* Vehicle Image - Small on left */}
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.vehicleImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="car-outline" size={32} color={theme.colors.textTertiary} />
              </View>
            )}
          </View>
          
          {/* Vehicle Info - Right side */}
          <View style={styles.infoContainer}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleModel}>{modelName}</Text>
                <Text style={styles.vehicleTrim}>{item.trim}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  {item.msrp?.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
            
            <View style={styles.specsContainer}>
              {item.range && (
                <View style={styles.specRow}>
                  <Ionicons name="battery-charging" size={14} color={theme.colors.accent} />
                  <Text style={styles.specText}>{item.range} km</Text>
                </View>
              )}
              
              {item.motorPower && (
                <View style={styles.specRow}>
                  <Ionicons name="flash" size={14} color={theme.colors.warning} />
                  <Text style={styles.specText}>{item.motorPower} kW</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Compare Icon Button */}
        <TouchableOpacity
          style={styles.compareIconButton}
          onPress={() => navigation.navigate('VehicleCompare', { vehicleId: item._id })}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>Không có xe nào</Text>
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
  listContent: {
    padding: theme.spacing.lg,
  },
  vehicleCard: {
    marginBottom: theme.spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
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
  infoContainer: {
    flex: 1,
    paddingRight: 40, // Space for compare icon
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
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
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs / 2,
  },
  specText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  compareIconButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['5xl'],
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
});

export default VehiclesScreen;

