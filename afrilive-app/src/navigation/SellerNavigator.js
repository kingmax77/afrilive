import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import GoLiveScreen from '../screens/seller/GoLiveScreen';
import ProductManagementScreen from '../screens/seller/ProductManagementScreen';
import AddEditProductScreen from '../screens/seller/AddEditProductScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import SellerProfileScreen from '../screens/seller/SellerProfileScreen';

import StoreProfileScreen from '../screens/seller/StoreProfileScreen';
import PricingCurrencyScreen from '../screens/seller/PricingCurrencyScreen';
import DeliveryPreferencesScreen from '../screens/seller/DeliveryPreferencesScreen';
import PaymentSettingsScreen from '../screens/seller/PaymentSettingsScreen';
import SellerNotificationsScreen from '../screens/seller/SellerNotificationsScreen';
import IDVerificationScreen from '../screens/seller/IDVerificationScreen';
import AnalyticsScreen from '../screens/seller/AnalyticsScreen';
import SellerSupportScreen from '../screens/seller/SellerSupportScreen';

const Tab = createBottomTabNavigator();
const ProductStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function ProductStackNavigator() {
  return (
    <ProductStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductStack.Screen name="ProductList" component={ProductManagementScreen} />
      <ProductStack.Screen name="AddEditProduct" component={AddEditProductScreen} />
    </ProductStack.Navigator>
  );
}

function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Dashboard: focused ? 'stats-chart' : 'stats-chart-outline',
            'Go Live': focused ? 'radio' : 'radio-outline',
            Products: focused ? 'cube' : 'cube-outline',
            Orders: focused ? 'cart' : 'cart-outline',
            Profile: focused ? 'person-circle' : 'person-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={SellerDashboardScreen} />
      <Tab.Screen
        name="Go Live"
        component={GoLiveScreen}
        options={{ tabBarActiveTintColor: COLORS.liveRed }}
      />
      <Tab.Screen name="Products" component={ProductStackNavigator} />
      <Tab.Screen name="Orders" component={SellerOrdersScreen} />
      <Tab.Screen name="Profile" component={SellerProfileScreen} />
    </Tab.Navigator>
  );
}

export default function SellerNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="SellerTabs" component={SellerTabs} />
      <RootStack.Screen name="StoreProfile" component={StoreProfileScreen} />
      <RootStack.Screen name="PricingCurrency" component={PricingCurrencyScreen} />
      <RootStack.Screen name="DeliveryPreferences" component={DeliveryPreferencesScreen} />
      <RootStack.Screen name="PaymentSettings" component={PaymentSettingsScreen} />
      <RootStack.Screen name="SellerNotifications" component={SellerNotificationsScreen} />
      <RootStack.Screen name="IDVerification" component={IDVerificationScreen} />
      <RootStack.Screen name="Analytics" component={AnalyticsScreen} />
      <RootStack.Screen name="SellerSupport" component={SellerSupportScreen} />
    </RootStack.Navigator>
  );
}
