import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { vehicleService } from "../../services/vehicleService";
import { theme } from "../../theme";
import { Loading } from "../../components/Loading";

const { width, height } = Dimensions.get("window");

const VehicleComparisonResultScreen = ({ route, navigation }) => {
  const { selectedIds } = route.params;
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSelectedVehicles();
  }, []);

  const loadSelectedVehicles = async () => {
    try {
      const all = await vehicleService.getVehicles();
      const filtered = all.filter((v) => selectedIds.includes(v._id));
      setVehicles(filtered);
    } catch (error) {
      console.error("Error loading compare vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={theme.colors.textPrimary}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Kết quả so sánh</Text>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.cellLabel} />
              {vehicles.map((v) => (
                <View key={v._id} style={styles.cellVehicle}>
                  <Image
                    source={{
                      uri:
                        v.images?.[0] ||
                        v.model?.images?.[0] ||
                        v.image ||
                        v.model?.imageUrl ||
                        null,
                    }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <Text style={styles.model} numberOfLines={1}>
                    {v.model?.name || "N/A"}
                  </Text>
                  <Text style={styles.trim} numberOfLines={1}>
                    {v.trim || "Phiên bản chuẩn"}
                  </Text>
                </View>
              ))}
            </View>

            {/* Table Rows */}
            {[
              { label: "Giá bán", key: "msrp", unit: "đ" },
              { label: "Quãng đường", key: "range", unit: "km" },
              { label: "Công suất", key: "motorPower", unit: "kW" },
              { label: "Dung lượng pin", key: "batteryCapacity", unit: "kWh" },
              { label: "Tốc độ tối đa", key: "topSpeed", unit: "km/h" },
            ].map((row, index) => (
              <View
                key={row.key}
                style={[
                  styles.row,
                  { backgroundColor: index % 2 === 0 ? "#fafafa" : "#fff" },
                ]}
              >
                <Text style={styles.cellLabel}>{row.label}</Text>
                {vehicles.map((v) => (
                  <Text key={v._id} style={styles.cellValue}>
                    {v[row.key]
                      ? `${v[row.key].toLocaleString("vi-VN")} ${row.unit}`
                      : "N/A"}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginLeft: 12,
  },
  table: {
    flexDirection: "column",
    minWidth: width,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 8,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f1f1",
  },
  cellLabel: {
    width: 130,
    paddingLeft: 10,
    fontWeight: "600",
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  cellVehicle: {
    width: width * 0.45,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  cellValue: {
    width: width * 0.45,
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    marginBottom: 6,
  },
  model: {
    fontWeight: "700",
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  trim: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
});

export default VehicleComparisonResultScreen;
