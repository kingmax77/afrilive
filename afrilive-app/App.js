import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { AuthProvider } from './src/hooks/useAuth';
import { OrdersProvider } from './src/context/OrdersContext';
import RootNavigator from './src/navigation/RootNavigator';

enableScreens();

const navTheme = {
  dark: true,
  colors: {
    primary: '#E8A020',
    background: '#0A0A0A',
    card: '#141414',
    text: '#FFFFFF',
    border: '#2A2A2A',
    notification: '#FF3B30',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <OrdersProvider>
            <NavigationContainer theme={navTheme}>
              <StatusBar style="light" backgroundColor="#0A0A0A" />
              <RootNavigator />
            </NavigationContainer>
          </OrdersProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
