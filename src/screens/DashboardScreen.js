import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loading } from '../components/Loading';
import { theme } from '../theme';
import { dashboardService } from '../services/dashboardService';
import { orderService } from '../services/orderService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const currentIndex = useRef(ITEM_COUNT); // Start at middle

  useEffect(() => {
    loadDashboard();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadDashboard = async () => {
    try {
      // Load personal stats và recent orders
      const [statsData, ordersData] = await Promise.all([
        dashboardService.getPersonalStats(),
        orderService.getOrders(),
      ]);
      
      setStats(statsData);
      // Lấy 5 orders gần nhất (đã sorted by createdAt DESC từ backend)
      const sortedOrders = Array.isArray(ordersData) 
        ? ordersData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        : [];
      setRecentOrders(sortedOrders.slice(0, 5));
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return <Loading />;
  }

  const summary = stats?.summary || {};
  const personalStats = stats?.summary || {};
  const totalRevenue = personalStats.totalRevenue || 0;
  const totalOrders = personalStats.totalOrders || 0;
  const averageOrderValue = personalStats.averageOrderValue || 0;
  const ordersByStatus = personalStats.ordersByStatus || {};

  // Tính pending orders từ ordersByStatus
  const pendingOrders = ordersByStatus.new || ordersByStatus.confirmed || 0;
  const deliveredOrders = ordersByStatus.delivered || 0;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userName = user?.profile?.name || user?.email || 'User';
  
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Title và Avatar */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Tổng quan</Text>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(userName)}</Text>
              </View>
              <View style={styles.onlineIndicator} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerUserInfo}>
            <Text style={styles.greetingText}>{greeting()}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>{userName}</Text>
          </View>
        </Animated.View>

        {/* Compact Revenue Card */}
        <Animated.View style={[styles.revenueCard, { opacity: fadeAnim }]}>
          <View style={styles.revenueCardGradient}>
            <View style={styles.revenueHeader}>
              <View style={styles.revenueLeft}>
                <Text style={styles.revenueLabel}>Monthly Revenue</Text>
                <Text style={styles.revenueAmount} numberOfLines={1}>
                  {totalRevenue.toLocaleString('vi-VN')} đ
                </Text>
              </View>
              <View style={styles.revenueIcon}>
                <Ionicons name="trending-up" size={20} color={theme.colors.textWhite} />
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
                <Text style={styles.revenueStatValue} numberOfLines={1}>
                  {averageOrderValue.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Stats Carousel - Infinite Loop, Center Snapping */}
        <View style={styles.statsCarouselContainer}>
          <ScrollView 
            ref={carouselRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsCarousel}
            snapToInterval={CARD_WRAPPER_WIDTH}
            snapToAlignment="center"
            decelerationRate="fast"
            pagingEnabled={false}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / CARD_WRAPPER_WIDTH);
              currentIndex.current = index;
              
              // Infinite loop: if at start, jump to middle
              if (index === 0) {
                setTimeout(() => {
                  currentIndex.current = ITEM_COUNT;
                  carouselRef.current?.scrollTo({
                    x: ITEM_COUNT * CARD_WRAPPER_WIDTH,
                    animated: false,
                  });
                }, 50);
              }
              // Infinite loop: if at end, jump to middle
              else if (index >= ITEM_COUNT * 2) {
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
              // Start at middle position for infinite scroll
              currentIndex.current = ITEM_COUNT;
              carouselRef.current?.scrollTo({
                x: ITEM_COUNT * CARD_WRAPPER_WIDTH,
                animated: false,
              });
            }}
          >
            {/* Duplicate cards for infinite loop */}
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
                {recentOrders.length} {recentOrders.length === 1 ? 'order' : 'orders'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Orders')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
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
                <Ionicons name="document-outline" size={48} color={theme.colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>Start by creating your first order</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('CreateOrder')}
              >
                <Text style={styles.emptyButtonText}>Create Order</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="add-circle"
              label="Add Vehicle"
              color={theme.colors.primary}
              onPress={() => navigation.navigate('Products')}
            />
            <QuickActionButton
              icon="cart"
              label="New Order"
              color={theme.colors.accent}
              onPress={() => navigation.navigate('CreateOrder')}
            />
            <QuickActionButton
              icon="document-text"
              label="Quotes"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate('Quotes')}
            />
            <QuickActionButton
              icon="people"
              label="Customers"
              color={theme.colors.warning}
              onPress={() => navigation.navigate('Customers')}
            />
          </View>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

// Stat Card Component
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
      style={[
        styles.statCard,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// Order Card Component
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

  // Lấy customer name từ API
  const customerName = order.customer?.fullName || order.customer?.email || 'N/A';
  
  // Lấy vehicle info từ items
  const firstItem = order.items?.[0];
  const vehicleModel = firstItem?.variant?.trim || 
                       firstItem?.variant?.model?.name || 
                       'N/A';
  
  // Tính total từ items
  const total = order.items?.reduce((sum, item) => {
    return sum + ((item.unitPrice || 0) * (item.qty || 0));
  }, 0) || order.total || 0;

  const status = order.status || 'new';

  return (
    <Animated.View
      style={{
        transform: [{ translateX: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
        activeOpacity={0.7}
      >
        <View style={styles.orderLeft}>
          <View style={[styles.orderIcon, { backgroundColor: getStatusColor(status) + '15' }]}>
            <Ionicons name="document-text" size={20} color={getStatusColor(status)} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCustomer} numberOfLines={1}>
              {customerName}
            </Text>
            <Text style={styles.orderVehicle} numberOfLines={1}>
              {vehicleModel}
            </Text>
          </View>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.orderAmount}>
            {total.toLocaleString('vi-VN')} đ
          </Text>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(status) + '20' }]}>
            <Text style={[styles.statusPillText, { color: getStatusColor(status) }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Quick Action Button
const QuickActionButton = ({ icon, label, color, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.quickAction}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  headerUserInfo: {
    marginTop: theme.spacing.xs,
  },
  greetingText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: 2,
  },
  userNameText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  avatarText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textWhite,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  revenueCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  revenueCardGradient: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadow.md,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  revenueLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  revenueLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textWhite + 'DD',
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textWhite,
    fontFamily: theme.typography.fontFamily.bold,
  },
  revenueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.textWhite + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.textWhite + '20',
  },
  revenueStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  revenueStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textWhite + 'CC',
    marginBottom: 4,
  },
  revenueStatValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textWhite,
  },
  revenueStatDivider: {
    width: 1,
    backgroundColor: theme.colors.textWhite + '30',
  },
  statsCarouselContainer: {
    marginBottom: theme.spacing.lg,
  },
  statsCarousel: {
    paddingLeft: PADDING_HORIZONTAL,
    paddingRight: PADDING_HORIZONTAL,
    gap: CARD_GAP,
    alignItems: 'center',
  },
  statCardWrapper: {
    width: CARD_WRAPPER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.md,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginRight: 4,
  },
  ordersContainer: {
    gap: theme.spacing.sm,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  orderVehicle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statusPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'],
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.xl,
    marginTop: theme.spacing.sm,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadow.sm,
  },
  emptyButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textWhite,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  quickActionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});

export default DashboardScreen;
