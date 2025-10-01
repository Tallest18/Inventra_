// app/(routes)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function RoutesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Profile"
        options={{
          headerShown: false,
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="AccountScreen"
        options={{
          headerShown: false,
          title: "Account",
        }}
      />
      <Stack.Screen
        name="NewProductScreen"
        options={{
          headerShown: false,
          title: "New Product",
        }}
      />
      <Stack.Screen
        name="QuickSellScreen"
        options={{
          headerShown: false,
          title: "Quick Sell",
        }}
      />
      <Stack.Screen
        name="TotalSummaryScreen"
        options={{
          headerShown: false,
          title: "Sales Summary",
        }}
      />
      <Stack.Screen
        name="HelpCenterScreen"
        options={{
          headerShown: false,
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="SettingsScreen"
        options={{
          headerShown: false,
          title: "Profile",
        }}
      />
    </Stack>
  );
}
