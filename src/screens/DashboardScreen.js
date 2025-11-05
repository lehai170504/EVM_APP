import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { Loading } from "../components/Loading";
import { theme } from "../theme";
import { dashboardService } from "../services/dashboardService";
import { orderService } from "../services/orderService";
import { useAuth } from "../context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = 260;
const CARD_GAP = 16;
const CARD_WRAPPER_WIDTH = CARD_WIDTH + CARD_GAP;
const PADDING_HORIZONTAL = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const ITEM_COUNT = 3;

const DashboardScreen = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const carouselRef = useRef(null);
  const currentIndex = useRef(ITEM_COUNT);

  useEffect(() => {
    loadDashboard();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        dashboardService.getPersonalStats(),
        orderService.getOrders(),
      ]);

      setStats(statsData);

      const sortedOrders = Array.isArray(ordersData)
        ? ordersData.sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          )
        : [];
      setRecentOrders(sortedOrders.slice(0, 5));
    } catch (error) {
      console.error("Load dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) return <Loading />;

  const personalStats = stats?.summary || {};
  const totalRevenue = personalStats.totalRevenue || 0;
  const totalOrders = personalStats.totalOrders || 0;
  const averageOrderValue = personalStats.averageOrderValue || 0;
  const ordersByStatus = personalStats.ordersByStatus || {};
  const pendingOrders = ordersByStatus.new || ordersByStatus.confirmed || 0;
  const deliveredOrders = ordersByStatus.delivered || 0;

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const userName = user?.profile?.name || user?.email || "User";

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Tổng quan</Text>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => navigation.navigate("Settings")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#8e44ad", "#3498db"]}
                style={styles.avatarGradient}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                </View>
                <View style={styles.onlineIndicator} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.headerUserInfo}>
            <Text style={styles.greetingText}>{greeting()}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {userName}
            </Text>
          </View>
        </Animated.View>

        {/* Revenue Card */}
        <Animated.View style={[styles.revenueCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={["#6a11cb", "#2575fc"]}
            style={styles.revenueCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.revenueHeader}>
              <View style={styles.revenueLeft}>
                <Text style={styles.revenueLabel}>Monthly Revenue</Text>
                <Text style={styles.revenueAmount}>
                  {totalRevenue.toLocaleString("vi-VN")} đ
                </Text>
              </View>
              <View style={styles.revenueIcon}>
                <Ionicons name="trending-up" size={24} color="#fff" />
              </View>
            </View>
            <View style={styles.revenueStats}>
              <View style={styles.revenueStatItem}>
                <Text style={styles.revenueStatLabel}>Orders</Text>
                <Text style={styles.revenueStatValue}>{totalOrders}</Text>
              </View>
              <View style={styles.revenueStatDivider} />
              <View style={styles.revenueStatItem}>
                <Text style={styles.revenueStatLabel}>Avg</Text>
                <Text style={styles.revenueStatValue}>
                  {averageOrderValue.toLocaleString("vi-VN")} đ
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Carousel */}
        <View style={styles.statsCarouselContainer}>
          <ScrollView
            ref={carouselRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsCarousel}
            snapToInterval={CARD_WRAPPER_WIDTH}
            decelerationRate="fast"
            pagingEnabled={false}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / CARD_WRAPPER_WIDTH);
              currentIndex.current = index;

              if (index === 0 || index >= ITEM_COUNT * 2) {
                setTimeout(() => {
                  currentIndex.current = ITEM_COUNT;
                  carouselRef.current?.scrollTo({
                    x: ITEM_COUNT * CARD_WRAPPER_WIDTH,
                    animated: false,
                  });
                }, 50);
              }
            }}
            onContentSizeChange={() => {
              currentIndex.current = ITEM_COUNT;
              carouselRef.current?.scrollTo({
                x: ITEM_COUNT * CARD_WRAPPER_WIDTH,
                animated: false,
              });
            }}
          >
            {[...Array(ITEM_COUNT * 3)].map((_, index) => {
              const realIndex = index % ITEM_COUNT;
              let icon, label, value, color, delay;

              if (realIndex === 0) {
                icon = "clipboard";
                label = "Total Orders";
                value = totalOrders;
                color = theme.colors.primary;
                delay = 100;
              } else if (realIndex === 1) {
                icon = "time";
                label = "Pending";
                value = pendingOrders;
                color = theme.colors.warning;
                delay = 200;
              } else {
                icon = "checkmark-circle";
                label = "Delivered";
                value = deliveredOrders;
                color = theme.colors.success;
                delay = 300;
              }

              return (
                <View key={index} style={styles.statCardWrapper}>
                  <StatCard
                    icon={icon}
                    label={label}
                    value={value}
                    color={color}
                    delay={delay}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <Text style={styles.sectionSubtitle}>
                {recentOrders.length}{" "}
                {recentOrders.length === 1 ? "order" : "orders"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate("Orders")}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {recentOrders.length > 0 ? (
            <View style={styles.ordersContainer}>
              {recentOrders.map((order, index) => (
                <OrderCard
                  key={order._id || index}
                  order={order}
                  navigation={navigation}
                  index={index}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="document-outline"
                  size={48}
                  color={theme.colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>
                Start by creating your first order
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate("CreateOrder")}
              >
                <Text style={styles.emptyButtonText}>Create Order</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="calendar-outline"
              label="Lịch lái thử"
              color={theme.colors.tertiary}
              onPress={() => navigation.navigate("TestDrives")}
            />
            <QuickActionButton
              icon="add-circle"
              label="Danh sách xe điện"
              color={theme.colors.primary}
              onPress={() => navigation.navigate("Products")}
            />
            <QuickActionButton
              icon="cart"
              label="New Order"
              color={theme.colors.accent}
              onPress={() => navigation.navigate("CreateOrder")}
            />
            <QuickActionButton
              icon="document-text"
              label="Quotes"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate("Quotes")}
            />
            <QuickActionButton
              icon="people"
              label="Customers"
              color={theme.colors.warning}
              onPress={() => navigation.navigate("Customers")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------------- Stat Card ----------------
const StatCard = ({ icon, label, value, color, delay }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}
    >
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "20" }]}
      >
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.statValue}>{value.toLocaleString("vi-VN")}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// ---------------- Order Card ----------------
const OrderCard = ({ order, navigation, index }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getStatusColor = (status) => {
    const statusColors = {
      new: theme.colors.statusPending,
      confirmed: theme.colors.statusConfirmed,
      allocated: theme.colors.primary,
      invoiced: theme.colors.primary,
      delivered: theme.colors.statusCompleted,
      cancelled: theme.colors.statusCancelled,
    };
    return statusColors[status?.toLowerCase()] || theme.colors.textSecondary;
  };

  const customerName =
    order.customer?.fullName || order.customer?.email || "N/A";
  const firstItem = order.items?.[0];
  const vehicleModel =
    firstItem?.variant?.trim || firstItem?.variant?.model?.name || "N/A";
  const total =
    order.items?.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * (item.qty || 0),
      0
    ) ||
    order.total ||
    0;
  const status = order.status || "new";

  return (
    <Animated.View
      style={{ transform: [{ translateX: slideAnim }], opacity: opacityAnim }}
    >
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() =>
          navigation.navigate("OrderDetail", { orderId: order._id })
        }
        activeOpacity={0.8}
      >
        <View style={styles.orderLeft}>
          <View
            style={[
              styles.orderIcon,
              { backgroundColor: getStatusColor(status) + "15" },
            ]}
          >
            <Ionicons
              name="document-text"
              size={20}
              color={getStatusColor(status)}
            />
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCustomer}>{customerName}</Text>
            <Text style={styles.orderVehicle}>{vehicleModel}</Text>
          </View>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.orderAmount}>
            {total.toLocaleString("vi-VN")} đ
          </Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: getStatusColor(status) + "20" },
            ]}
          >
            <Text
              style={[styles.statusPillText, { color: getStatusColor(status) }]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ---------------- Quick Action ----------------
const QuickActionButton = ({ icon, label, color, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.quickAction}
        onPress={onPress}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[styles.quickActionIcon, { backgroundColor: color + "20" }]}
        >
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  header: { paddingHorizontal: 16, marginBottom: 24 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  avatarContainer: {},
  avatarGradient: {
    borderRadius: 24,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700" },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4cd137",
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerUserInfo: { marginTop: 12 },
  greetingText: { color: theme.colors.textSecondary, fontSize: 14 },
  userNameText: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  revenueCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  revenueCardGradient: { padding: 20, borderRadius: 16 },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  revenueLeft: {},
  revenueLabel: { color: "#fff", fontSize: 14 },
  revenueAmount: { color: "#fff", fontSize: 28, fontWeight: "700" },
  revenueIcon: { backgroundColor: "#ffffff30", padding: 12, borderRadius: 12 },
  revenueStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  revenueStatItem: { flex: 1, alignItems: "center" },
  revenueStatLabel: { color: "#fff", fontSize: 12 },
  revenueStatValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  revenueStatDivider: { width: 1, height: 36, backgroundColor: "#ffffff50" },
  statsCarouselContainer: { marginBottom: 24 },
  statsCarousel: { paddingHorizontal: PADDING_HORIZONTAL },
  statCardWrapper: { width: CARD_WRAPPER_WIDTH, alignItems: "center" },
  statCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: { fontSize: 14, color: theme.colors.textSecondary },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  sectionSubtitle: { fontSize: 12, color: theme.colors.textSecondary },
  seeAllButton: { flexDirection: "row", alignItems: "center" },
  seeAllText: {
    color: theme.colors.primary,
    fontWeight: "600",
    marginRight: 4,
  },
  ordersContainer: { gap: 12 },
  orderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  orderLeft: { flexDirection: "row", alignItems: "center" },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  orderInfo: {},
  orderCustomer: { fontWeight: "600", color: theme.colors.textPrimary },
  orderVehicle: { fontSize: 12, color: theme.colors.textSecondary },
  orderRight: { alignItems: "flex-end" },
  orderAmount: { fontWeight: "600", color: theme.colors.textPrimary },
  statusPill: {
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  statusPillText: { fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  emptyButtonText: { color: "#fff", fontWeight: "700" },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionLabel: {
    fontWeight: "600",
    textAlign: "center",
    color: theme.colors.textPrimary,
  },
});

export default DashboardScreen;
