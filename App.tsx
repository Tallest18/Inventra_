// App.tsx
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";

// Keep splash while fonts load (optional)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    // Apply global defaults
    const customTextProps = {
      style: { fontFamily: "Poppins_400Regular" },
      // allowFontScaling: false, // optional
    };
    const customTextInputProps = {
      style: { fontFamily: "Poppins_400Regular" },
    };

    SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Let the splash screen show, or you can return a small loader
    return null;
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
