import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1 bg-background">
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F172A" },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="add-expense"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
