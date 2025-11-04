import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import VehiclesScreen from '../screens/vehicles/VehiclesScreen';
import VehicleDetailScreen from '../screens/vehicles/VehicleDetailScreen';
import VehicleCompareScreen from '../screens/vehicles/VehicleCompareScreen';
import QuotesScreen from '../screens/quotes/QuotesScreen';
import QuoteDetailScreen from '../screens/quotes/QuoteDetailScreen';
import CreateQuoteScreen from '../screens/quotes/CreateQuoteScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import CreateOrderScreen from '../screens/orders/CreateOrderScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import CustomerDetailScreen from '../screens/customers/CustomerDetailScreen';
import CreateCustomerScreen from '../screens/customers/CreateCustomerScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { LoadingScreen } from '../components/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 16,
          paddingTop: 10,
          paddingHorizontal: theme.spacing.md,
          position: 'absolute',
          bottom: theme.spacing.md,
          left: theme.spacing.lg,
          right: theme.spacing.lg,
          borderRadius: 30,
          marginBottom: theme.spacing.sm,
          marginLeft: theme.spacing.md,
          marginRight: theme.spacing.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 15,
          borderWidth: 1.5,
          borderColor: 'rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        },
        headerStyle: {
          backgroundColor: theme.colors.backgroundLight,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerShadowVisible: false,
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeight.semibold || '600',
          fontSize: theme.typography.fontSize.lg,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          title: 'Tổng quan',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Products"
        component={VehiclesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
          title: 'Sản phẩm',
        }}
      />
      <Tab.Screen
        name="Quotes"
        component={QuotesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
          title: 'Báo giá',
          headerShown: false,

        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
          title: 'Đơn hàng',
          headerShown: false,

        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          title: 'Khách hàng',
          headerShown: false,

        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  // Ensure loading is boolean
  if (loading === true) {
    return <LoadingScreen />;
  }

  // Ensure isAuthenticated is boolean
  const authenticated = Boolean(isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="VehicleDetail"
              component={VehicleDetailScreen}
              options={{ 
                headerShown: true, 
                title: 'Chi tiết xe',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="VehicleCompare"
              component={VehicleCompareScreen}
              options={{ 
                headerShown: true, 
                title: 'So sánh xe',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="QuoteDetail"
              component={QuoteDetailScreen}
              options={{ 
                headerShown: true, 
                title: 'Chi tiết báo giá',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="CreateQuote"
              component={CreateQuoteScreen}
              options={{ 
                headerShown: true, 
                title: 'Tạo báo giá',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{ 
                headerShown: true, 
                title: 'Chi tiết đơn hàng',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="CreateOrder"
              component={CreateOrderScreen}
              options={{ 
                headerShown: true, 
                title: 'Tạo đơn hàng',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="CustomerDetail"
              component={CustomerDetailScreen}
              options={{ 
                headerShown: true, 
                title: 'Chi tiết khách hàng',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="CreateCustomer"
              component={CreateCustomerScreen}
              options={{ 
                headerShown: true, 
                title: 'Tạo khách hàng',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{ 
                headerShown: true, 
                title: 'Báo cáo',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ 
                headerShown: true, 
                title: 'Cài đặt',
                headerStyle: {
                  backgroundColor: theme.colors.backgroundLight,
                },
                headerTintColor: theme.colors.textPrimary,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

