import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import FlashMessage from "react-native-flash-message";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
        <FlashMessage position="top" floating={true} />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
