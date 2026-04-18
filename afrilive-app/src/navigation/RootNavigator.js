import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';

import SplashScreen from '../screens/SplashScreen';
import RoleScreen from '../screens/RoleScreen';
import AuthScreen from '../screens/AuthScreen';
import PhoneScreen from '../screens/auth/PhoneScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import BuyerNavigator from './BuyerNavigator';
import SellerNavigator from './SellerNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user ? (
        <>
          <Stack.Screen name="Splash"    component={SplashScreen} />
          <Stack.Screen name="Role"      component={RoleScreen}      options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Phone"     component={PhoneScreen}     options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="OTP"       component={OTPScreen}       options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Register"  component={RegisterScreen}  options={{ animation: 'slide_from_right' }} />
          {/* Legacy screen kept so deep links / old navigation calls don't break */}
          <Stack.Screen name="Auth"      component={AuthScreen}      options={{ animation: 'slide_from_right' }} />
        </>
      ) : user.role === 'seller' ? (
        <Stack.Screen name="SellerApp" component={SellerNavigator} />
      ) : (
        <Stack.Screen name="BuyerApp" component={BuyerNavigator} />
      )}
    </Stack.Navigator>
  );
}
