import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { AppStackParamList } from "./types";

// Import all your screen components
import Onboarding1 from "@/app/(Anboarding)/Onboarding1";
import BusinessSelectionScreen from "@/app/(Auth)/BusinessSelectionScreen";
import VerificationScreen from "@/app/(Auth)/VerificationScreen";
import WelcomeScreen from "@/app/(Auth)/WelcomeScreen";
import MessagesScreen from "@/app/(Routes)/MessagesScreen";
import NotificationDetails from "@/app/(Routes)/NotificationDetails";
import NotificationsScreen from "@/app/(Routes)/NotificationsScreen";
import ProductDetails from "@/app/(Routes)/ProductDetails";
import Profile from "@/app/(Routes)/Profile";
import QuickSellScreen from "@/app/(Routes)/QuickSellScreen";
import TotalSummaryScreen from "@/app/(Routes)/TotalSummaryScreen";
import BottomTabNavigator from "./BottomTabNavigator";

const Stack = createStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Onboarding1"
    >
      {/* Onboarding and Authentication Flow */}
      <Stack.Screen name="Onboarding1" component={Onboarding1} />
      <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
      <Stack.Screen name="VerificationScreen" component={VerificationScreen} />
      <Stack.Screen
        name="BusinessSelectionScreen"
        component={BusinessSelectionScreen}
      />

      {/* App-specific routes */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen
        name="NotificationDetails"
        component={NotificationDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="TotalSummary" component={TotalSummaryScreen} />

      <Stack.Screen name="QuickSell" component={QuickSellScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} />

      {/* Main app flow (bottom tabs) */}
      <Stack.Screen name="(Main)" component={BottomTabNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
