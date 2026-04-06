import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import CreateAddressScreen from '../screens/CreateAddressScreen';
import ParcelTrackingScreen from '../screens/ParcelTrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function ResidentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home:     focused ? 'home'           : 'home-outline',
            Create:   focused ? 'add-circle'     : 'add-circle-outline',
            Track:    focused ? 'cube'            : 'cube-outline',
            Profile:  focused ? 'person'          : 'person-outline',
          };
          return (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons name={icons[route.name]} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}           options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Create"  component={CreateAddressScreen}  options={{ tabBarLabel: 'Create Address' }} />
      <Tab.Screen name="Track"   component={ParcelTrackingScreen} options={{ tabBarLabel: 'Track Parcel' }} />
      <Tab.Screen name="Profile" component={ProfileScreen}        options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.darkSurface,
    borderTopColor: colors.darkBorder,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    width: 36,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  iconWrapperActive: {
    backgroundColor: colors.goldFaded,
  },
});
