import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import SignupScreen from '../screens/SignupScreen';
import RoleSwitcherScreen from '../screens/RoleSwitcherScreen';
import AddressDetailScreen from '../screens/AddressDetailScreen';
import SharedAddressScreen from '../screens/SharedAddressScreen';
import AddressListScreen from '../screens/AddressListScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import SupportScreen from '../screens/SupportScreen';
import AboutScreen from '../screens/AboutScreen';
import ActiveDeliveryScreen from '../screens/ActiveDeliveryScreen';
import DeliveryHistoryScreen from '../screens/DeliveryHistoryScreen';
import EarningsScreen from '../screens/EarningsScreen';
import VehicleDocumentsScreen from '../screens/VehicleDocumentsScreen';
import ResidentTabNavigator from './ResidentTabNavigator';
import RiderTabNavigator from './RiderTabNavigator';
import RoleSwitcherPill from '../components/RoleSwitcherPill';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { roles, activeRole, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const hasRoles = roles.length > 0;
  const hasBothRoles = roles.includes('RIDER') && roles.includes('RESIDENT');

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={({ navigation }) => ({
            headerStyle: { backgroundColor: colors.darkSurface },
            headerTintColor: colors.gold,
            headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.white },
            headerShadowVisible: false,
            headerBackTitleVisible: false,
            headerLeft: ({ canGoBack }) =>
              canGoBack ? (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ paddingRight: 8 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.gold} />
                </TouchableOpacity>
              ) : null,
          })}
        >
          {!hasRoles ? (
            // ── Auth flow ──
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{ headerShown: false }}
            />
          ) : !activeRole ? (
            // ── Multi-role chooser (shown after login when user has >1 role) ──
            <Stack.Screen
              name="RoleSwitcher"
              component={RoleSwitcherScreen}
              options={{ headerShown: false }}
            />
          ) : activeRole === 'resident' ? (
            // ── Resident main tabs ──
            <Stack.Screen
              name="ResidentTabs"
              component={ResidentTabNavigator}
              options={{ headerShown: false }}
            />
          ) : (
            // ── Rider main tabs ──
            <Stack.Screen
              name="RiderTabs"
              component={RiderTabNavigator}
              options={{ headerShown: false }}
            />
          )}

          {/* ── Shared stack screens (accessible from any tab) ── */}
          <Stack.Screen
            name="AddressDetail"
            component={AddressDetailScreen}
            options={{ title: 'Address Details' }}
          />
          <Stack.Screen
            name="SharedAddress"
            component={SharedAddressScreen}
            options={{ title: 'Delivery View' }}
          />

          {/* ── Profile sub-screens ── */}
          <Stack.Screen
            name="AddressList"
            component={AddressListScreen}
            options={{ title: 'My Addresses' }}
          />
          <Stack.Screen
            name="OrderHistory"
            component={OrderHistoryScreen}
            options={{ title: 'Order History' }}
          />
          <Stack.Screen
            name="Support"
            component={SupportScreen}
            options={{ title: 'Help & Support' }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ title: 'About SmartAddress' }}
          />
          <Stack.Screen
            name="ActiveDelivery"
            component={ActiveDeliveryScreen}
            options={{ title: 'Active Delivery' }}
          />
          <Stack.Screen
            name="DeliveryHistory"
            component={DeliveryHistoryScreen}
            options={{ title: 'Delivery History' }}
          />
          <Stack.Screen
            name="Earnings"
            component={EarningsScreen}
            options={{ title: 'Earnings' }}
          />
          <Stack.Screen
            name="VehicleDocuments"
            component={VehicleDocumentsScreen}
            options={{ title: 'Vehicle & Documents' }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Floating role switcher — only shown when user has both roles and is in a tab screen */}
      {hasBothRoles && !!activeRole && <RoleSwitcherPill />}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
