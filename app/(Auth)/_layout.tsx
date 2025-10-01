// app/(Auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WelcomeScreen" />
      <Stack.Screen name="VerificationScreen" />
      <Stack.Screen name="BusinessSelectionScreen" />
    </Stack>
  );
}
