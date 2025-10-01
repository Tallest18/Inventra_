// app/_layout.tsx
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      {/* Onboarding flow */}
      <Stack.Screen name="index" />

      {/* Authentication flow */}
      <Stack.Screen name="(Auth)" />

      {/* Main app flow (bottom tabs) */}
      <Stack.Screen name="(Main)" />
    </Stack>
  );
}
