import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AddressProvider } from './src/context/AddressContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AddressProvider>
          <StatusBar style="light" backgroundColor="#0A0A0A" />
          <AppNavigator />
        </AddressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
