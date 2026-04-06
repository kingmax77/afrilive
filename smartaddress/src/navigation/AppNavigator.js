import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import SignupScreen from '../screens/SignupScreen';
import AddressDetailScreen from '../screens/AddressDetailScreen';
import SharedAddressScreen from '../screens/SharedAddressScreen';
import ResidentTabNavigator from './ResidentTabNavigator';
import RiderTabNavigator from './RiderTabNavigator';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { role, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
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
        {!role ? (
          // ── Auth flow ──
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
        ) : role === 'resident' ? (
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
      </Stack.Navigator>
    </NavigationContainer>
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
