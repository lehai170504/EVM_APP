import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";

// Main Screens
import DashboardScreen from "../screens/DashboardScreen";
import VehiclesScreen from "../screens/vehicles/VehiclesScreen";
import VehicleDetailScreen from "../screens/vehicles/VehicleDetailScreen";
import VehicleCompareScreen from "../screens/vehicles/VehicleCompareScreen";
import QuotesScreen from "../screens/quotes/QuotesScreen";
import QuoteDetailScreen from "../screens/quotes/QuoteDetailScreen";
import CreateQuoteScreen from "../screens/quotes/CreateQuoteScreen";
import OrdersScreen from "../screens/orders/OrdersScreen";
import OrderDetailScreen from "../screens/orders/OrderDetailScreen";
import CreateOrderScreen from "../screens/orders/CreateOrderScreen";
import CustomersScreen from "../screens/customers/CustomersScreen";
import CustomerDetailScreen from "../screens/customers/CustomerDetailScreen";
import CreateCustomerScreen from "../screens/customers/CreateCustomerScreen";
import ReportsScreen from "../screens/ReportsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import VehicleComparisonResultScreen from "../screens/vehicles/VehicleComparisonResultScreen";

// Test Drive Screens
import TestDrivesScreen from "../screens/testDrives/TestDrivesScreen";
import TestDriveDetailScreen from "../screens/testDrives/TestDriveDetailScreen";
import CreateTestDriveScreen from "../screens/testDrives/CreateTestDriveScreen";

import { LoadingScreen } from "../components/LoadingScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          borderTopWidth: 0,
          height: 70,
          position: "absolute",
          bottom: theme.spacing.md,
          left: theme.spacing.lg,
          right: theme.spacing.lg,
          borderRadius: 30,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 15,
          borderWidth: 1.5,
          borderColor: "rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <Tab.Screen
        name="Products"
        component={VehiclesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
          title: "Sản phẩm",
        }}
      />

      <Tab.Screen
        name="Quotes"
        component={QuotesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
          title: "Báo giá",
        }}
      />

      {/* Dashboard ở giữa và nổi bật hơn */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: () => <Ionicons name="home" size={30} color="#fff" />,
          title: "Tổng quan",
          headerShown: false,
          tabBarButton: (props) => <CustomCenterButton {...props} />,
        }}
      />

      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
          title: "Đơn hàng",
        }}
      />

      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          title: "Khách hàng",
        }}
      />
    </Tab.Navigator>
  );
};

const CustomCenterButton = ({ children, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      top: -25,
      justifyContent: "center",
      alignItems: "center",
    }}
    activeOpacity={0.8}
  >
    <View
      style={{
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: theme.colors.primary,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
      }}
    >
      {children}
    </View>
  </TouchableOpacity>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const authenticated = Boolean(isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />

            {/* Vehicle */}
            <Stack.Screen
              name="VehicleDetail"
              component={VehicleDetailScreen}
              options={screenHeader("Chi tiết xe")}
            />
            <Stack.Screen
              name="VehicleCompare"
              component={VehicleCompareScreen}
              options={screenHeader("So sánh xe")}
            />

            {/* Quote */}
            <Stack.Screen
              name="QuoteDetail"
              component={QuoteDetailScreen}
              options={screenHeader("Chi tiết báo giá")}
            />
            <Stack.Screen
              name="CreateQuote"
              component={CreateQuoteScreen}
              options={screenHeader("Tạo báo giá")}
            />

            {/* Order */}
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={screenHeader("Chi tiết đơn hàng")}
            />
            <Stack.Screen
              name="CreateOrder"
              component={CreateOrderScreen}
              options={screenHeader("Tạo đơn hàng")}
            />

            {/* Customer */}
            <Stack.Screen
              name="CustomerDetail"
              component={CustomerDetailScreen}
              options={screenHeader("Chi tiết khách hàng")}
            />
            <Stack.Screen
              name="CreateCustomer"
              component={CreateCustomerScreen}
              options={screenHeader("Tạo khách hàng")}
            />

            {/* Report & Settings */}
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={screenHeader("Báo cáo")}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={screenHeader("Cài đặt")}
            />

            {/* Test Drive */}
            <Stack.Screen
              name="TestDrives"
              component={TestDrivesScreen}
              options={screenHeader("Lịch lái thử")}
            />
            <Stack.Screen
              name="CreateTestDrive"
              component={CreateTestDriveScreen}
              options={screenHeader("Tạo lịch lái thử")}
            />
            <Stack.Screen
              name="TestDriveDetail"
              component={TestDriveDetailScreen}
              options={screenHeader("Chi tiết lịch lái thử")}
            />
            <Stack.Screen
              name="VehicleComparisonResult"
              component={VehicleComparisonResultScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Helper: Tạo header style thống nhất
const screenHeader = (title) => ({
  headerShown: true,
  title,
  headerStyle: { backgroundColor: theme.colors.backgroundLight },
  headerTintColor: theme.colors.textPrimary,
});

export default AppNavigator;
