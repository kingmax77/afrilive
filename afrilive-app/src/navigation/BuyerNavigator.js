import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

import DiscoveryScreen from '../screens/buyer/DiscoveryScreen';
import LiveStreamScreen from '../screens/buyer/LiveStreamScreen';
import SearchScreen from '../screens/buyer/SearchScreen';
import BuyerOrdersScreen from '../screens/buyer/BuyerOrdersScreen';
import BuyerProfileScreen from '../screens/buyer/BuyerProfileScreen';

import SellerPublicProfileScreen from '../screens/buyer/SellerPublicProfileScreen';
import StreamNotStartedScreen from '../screens/buyer/StreamNotStartedScreen';
import BuyerNotificationsScreen from '../screens/buyer/BuyerNotificationsScreen';
import PaymentMethodsScreen from '../screens/buyer/PaymentMethodsScreen';
import PrivacySecurityScreen from '../screens/buyer/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/buyer/HelpSupportScreen';
import AboutScreen from '../screens/buyer/AboutScreen';

const Tab = createBottomTabNavigator();
const DiscoverStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function DiscoverStackNavigator() {
  return (
    <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
      <DiscoverStack.Screen name="DiscoveryFeed" component={DiscoveryScreen} />
      <DiscoverStack.Screen
        name="LiveStream"
        component={LiveStreamScreen}
        options={{ animation: 'fade' }}
      />
    </DiscoverStack.Navigator>
  );
}

function BuyerTabs() {
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
            Discover: focused ? 'home' : 'home-outline',
            Search: focused ? 'search' : 'search-outline',
            Orders: focused ? 'cube' : 'cube-outline',
            Profile: focused ? 'person-circle' : 'person-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverStackNavigator} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Orders" component={BuyerOrdersScreen} />
      <Tab.Screen name="Profile" component={BuyerProfileScreen} />
    </Tab.Navigator>
  );
}

export default function BuyerNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="BuyerTabs" component={BuyerTabs} />
      <RootStack.Screen name="SellerPublicProfile" component={SellerPublicProfileScreen} />
      <RootStack.Screen name="StreamNotStarted" component={StreamNotStartedScreen} />
      <RootStack.Screen name="BuyerNotifications" component={BuyerNotificationsScreen} />
      <RootStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <RootStack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <RootStack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <RootStack.Screen name="About" component={AboutScreen} />
    </RootStack.Navigator>
  );
}
