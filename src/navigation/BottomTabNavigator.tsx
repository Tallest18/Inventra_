import Finance from "@/app/(Main)/Finance";
import Home from "@/app/(Main)/Home";
import Inventory from "@/app/(Main)/Inventory";
import More from "@/app/(Main)/More";
import Sell from "@/app/(Main)/Sell";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

// Screens (must be PascalCase)

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "alert-circle-outline";

          if (route.name === "Home") {
            iconName = "home-outline";
          } else if (route.name === "Inventory") {
            iconName = "albums-outline";
          } else if (route.name === "Sell") {
            iconName = "cart-outline";
          } else if (route.name === "Finance") {
            iconName = "wallet-outline";
          } else if (route.name === "More") {
            iconName = "ellipsis-horizontal-circle-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "#3B82F6",
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Inventory" component={Inventory} />
      <Tab.Screen name="Sell" component={Sell} />
      <Tab.Screen name="Finance" component={Finance} />
      <Tab.Screen name="More" component={More} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
