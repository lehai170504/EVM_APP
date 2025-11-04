import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { vehicleService } from "../../services/vehicleService";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { theme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
      console.error("Load vehicle error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !vehicle) return <Loading />;

  const modelName =
    typeof vehicle.model === "object" ? vehicle.model?.name : "N/A";
  const images = vehicle.images || vehicle.model?.images || [];
  const mainImage = images.length > 0 ? images[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                <Ionicons
                  name="images"
                  size={14}
                  color={theme.colors.textWhite}
                />
                <Text style={styles.imageCount}>{images.length}</Text>
              </View>
            )}
          </View>
        )}

        {/* Vehicle Info */}
        <Card style={styles.infoCard}>
          <View style={styles.headerSection}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{modelName}</Text>
              <Text style={styles.subtitle}>{vehicle.trim}</Text>
            </View>
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Giá bán</Text>
              <Text style={styles.price}>
                {vehicle.msrp?.toLocaleString("vi-VN")} đ
              </Text>
            </View>
          </View>
        </Card>

        {/* Technical Specs */}
        {(vehicle.range || vehicle.motorPower || vehicle.battery) && (
          <Card style={styles.specsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="settings-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            </View>

            <View style={styles.specsGrid}>
              {vehicle.range && (
                <SpecItem
                  icon="battery-charging"
                  color={theme.colors.accent}
                  label="Tầm hoạt động"
                  value={`${vehicle.range} km`}
                />
              )}
              {vehicle.motorPower && (
                <SpecItem
                  icon="flash"
                  color={theme.colors.warning}
                  label="Công suất"
                  value={`${vehicle.motorPower} kW`}
                />
              )}
              {vehicle.battery && (
                <SpecItem
                  icon="battery-full"
                  color={theme.colors.primary}
                  label="Dung lượng pin"
                  value={vehicle.battery}
                />
              )}
            </View>
          </Card>
        )}

        {/* Colors */}
        {vehicle.colors && vehicle.colors.length > 0 && (
          <Card style={styles.colorsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="color-palette-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Màu sắc</Text>
            </View>

            <View style={styles.colorsGrid}>
              {vehicle.colors.map((color) => (
                <View key={color._id} style={styles.colorItem}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: color.hex || "#ccc" },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.colorName}>{color.name}</Text>
                    {color.extraPrice > 0 && (
                      <Text style={styles.extraPrice}>
                        +{color.extraPrice.toLocaleString("vi-VN")} đ
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Features */}
        {vehicle.features && vehicle.features.length > 0 && (
          <Card style={styles.featuresCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="star-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Tính năng</Text>
            </View>
            <View style={styles.featuresGrid}>
              {vehicle.features.map((feature, index) => (
                <View key={index} style={styles.featureBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.colors.success}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Gallery */}
        {images.length > 1 && (
          <Card style={styles.galleryCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="images-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Hình ảnh</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
            >
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

const SpecItem = ({ icon, color, label, value }) => (
  <View style={styles.specCard}>
    <View style={[styles.specIconContainer, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.specLabel}>{label}</Text>
    <Text style={styles.specValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: theme.spacing.xl },

  // Image
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: theme.colors.background,
    position: "relative",
  },
  mainImage: { width: "100%", height: "100%" },
  imageBadge: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.textPrimary + "CC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  imageCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textWhite,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Info
  infoCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: 0,
  },
  headerSection: { flexDirection: "row", justifyContent: "space-between" },
  titleSection: { flex: 1, marginRight: theme.spacing.md },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  priceSection: { alignItems: "flex-end" },
  priceLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
  },
  price: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  // Specs
  specsCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  specCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadow.sm,
  },
  specIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  specLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  specValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },

  // Colors
  colorsCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: 0,
  },
  colorsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  colorItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexBasis: "48%",
    ...theme.shadow.xs,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: theme.spacing.sm,
  },
  colorName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  extraPrice: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },

  // Features
  featuresCard: { margin: theme.spacing.lg, marginTop: theme.spacing.md },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.success + "15",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Gallery
  galleryCard: { margin: theme.spacing.lg, marginTop: theme.spacing.md },
  galleryScroll: { marginTop: theme.spacing.md },
  galleryItem: {
    width: 120,
    height: 120,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.background,
  },
  galleryImage: { width: "100%", height: "100%" },
});

export default VehicleDetailScreen;
