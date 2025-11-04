import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { vehicleService } from "../../services/vehicleService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { theme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

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
      console.error("Load vehicles error:", error);
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
    const modelName = typeof item.model === "object" ? item.model?.name : "N/A";
    let imageUrl = item.images?.[0] || item.model?.images?.[0] || null;

    // Animation khi nhấn
    const scaleAnim = new Animated.Value(1);
    const handlePressIn = () =>
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    const handlePressOut = () =>
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Card style={styles.vehicleCard}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() =>
              navigation.navigate("VehicleDetail", { vehicleId: item._id })
            }
          >
            {/* Image header */}
            <View style={styles.imageContainer}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.vehicleImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons
                    name="car-sport-outline"
                    size={40}
                    color={theme.colors.textTertiary}
                  />
                </View>
              )}
              {/* Overlay badge */}
              <View style={styles.badgeRow}>
                {item.range && (
                  <View style={styles.badge}>
                    <Ionicons
                      name="battery-charging"
                      size={12}
                      color={theme.colors.textWhite}
                    />
                    <Text style={styles.badgeText}>{item.range} km</Text>
                  </View>
                )}
                {item.motorPower && (
                  <View style={[styles.badge, { backgroundColor: "#FFB800" }]}>
                    <Ionicons
                      name="flash"
                      size={12}
                      color={theme.colors.textWhite}
                    />
                    <Text style={styles.badgeText}>{item.motorPower} kW</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Vehicle info */}
            <View style={styles.infoContainer}>
              <View style={styles.titleRow}>
                <View>
                  <Text style={styles.vehicleModel}>{modelName}</Text>
                  <Text style={styles.vehicleTrim}>{item.trim}</Text>
                </View>
                <Text style={styles.price}>
                  {item.msrp?.toLocaleString("vi-VN")} đ
                </Text>
              </View>

              {/* Colors preview */}
              {item.colors?.length > 0 && (
                <View style={styles.colorsRow}>
                  {item.colors.slice(0, 5).map((color) => (
                    <View
                      key={color._id}
                      style={[
                        styles.colorDot,
                        { backgroundColor: color.hex || "#ccc" },
                      ]}
                    />
                  ))}
                  {item.colors.length > 5 && (
                    <Text style={styles.moreColors}>
                      +{item.colors.length - 5}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Compare button */}
          <TouchableOpacity
            style={styles.compareButton}
            onPress={() =>
              navigation.navigate("VehicleCompare", { vehicleId: item._id })
            }
          >
            <Ionicons
              name="git-compare-outline"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </Card>
      </Animated.View>
    );
  };

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="car-outline"
              size={64}
              color={theme.colors.textTertiary}
            />
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
    paddingBottom: 100,
  },
  vehicleCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius["2xl"],
    overflow: "hidden",
    backgroundColor: "#fff",
    ...theme.shadow.md,
  },
  imageContainer: {
    height: 180,
    width: "100%",
    backgroundColor: theme.colors.backgroundLight,
    position: "relative",
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeRow: {
    position: "absolute",
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: theme.colors.textWhite,
    fontWeight: "500",
  },
  infoContainer: {
    padding: theme.spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  vehicleTrim: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  colorsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    gap: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  moreColors: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  compareButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    backgroundColor: theme.colors.primary + "15",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadow.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing["5xl"],
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
});

export default VehiclesScreen;
