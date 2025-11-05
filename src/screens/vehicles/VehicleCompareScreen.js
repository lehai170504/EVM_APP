import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { vehicleService } from "../../services/vehicleService";
import { Loading } from "../../components/Loading";
import { theme } from "../../theme";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const VehicleCompareScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
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
    }
  };

  const toggleSelection = (id) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedIds(newSelected);
  };

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="car-sport-outline"
          size={28}
          color={theme.colors.primary}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerSubtitle}>
            Chọn ít nhất 2 xe để so sánh ({selectedIds.length} đã chọn)
          </Text>
        </View>
        {selectedIds.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("VehicleComparisonResult", { selectedIds })
            }
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={22}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Vehicle Grid */}
      <FlatList
        data={vehicles}
        numColumns={2}
        contentContainerStyle={styles.grid}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item._id);

          const modelName =
            typeof item.model === "object"
              ? item.model?.name
              : item.model || "N/A";
          const imageUrl =
            item.images?.[0] ||
            item.model?.images?.[0] ||
            item.image ||
            item.model?.imageUrl ||
            null;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleSelection(item._id)}
              style={{ flex: 1, margin: 6 }}
            >
              <Animated.View
                style={[
                  styles.card,
                  isSelected && styles.selectedCard,
                  { opacity: fadeAnim },
                ]}
              >
                {/* Image */}
                <View style={styles.imageContainer}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholder}>
                      <Ionicons name="car-outline" size={40} color="#aaa" />
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.checkOverlay}>
                      <Ionicons
                        name="checkmark-circle"
                        size={28}
                        color={theme.colors.textWhite}
                      />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <Text style={styles.model} numberOfLines={1}>
                    {modelName}
                  </Text>
                  <Text style={styles.trim} numberOfLines={1}>
                    {item.trim || "Phiên bản chuẩn"}
                  </Text>
                  <Text style={styles.price}>
                    {item.msrp ? item.msrp.toLocaleString("vi-VN") + " đ" : "—"}
                  </Text>

                  <View style={styles.specsRow}>
                    {item.range && (
                      <View style={styles.specItem}>
                        <Ionicons
                          name="battery-charging"
                          size={12}
                          color={theme.colors.accent}
                        />
                        <Text style={styles.specText}>{item.range} km</Text>
                      </View>
                    )}
                    {item.motorPower && (
                      <View style={styles.specItem}>
                        <Ionicons
                          name="flash"
                          size={12}
                          color={theme.colors.warning}
                        />
                        <Text style={styles.specText}>
                          {item.motorPower} kW
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Compare Button */}
      {selectedIds.length >= 2 && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.compareButton}
          onPress={() =>
            navigation.navigate("VehicleComparisonResult", { selectedIds })
          }
        >
          <Ionicons name="stats-chart" size={20} color="#fff" />
          <Text style={styles.compareButtonText}>So sánh ngay</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  clearButton: {
    padding: 4,
  },
  grid: {
    padding: 8,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 3,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: "100%",
    height: width * 0.35,
    backgroundColor: "#f9f9f9",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 50,
    padding: 2,
  },
  info: {
    padding: 10,
  },
  model: {
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  trim: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  price: {
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  specsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  compareButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    elevation: 5,
  },
  compareButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default VehicleCompareScreen;
