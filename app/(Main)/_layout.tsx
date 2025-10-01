import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

const MainLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "black", // active = black
        tabBarInactiveTintColor: "#3B82F6", // inactive = blue
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: 20,
          paddingTop: 10,
          height: 80,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
        },
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: "500",
          marginTop: 4,
          fontFamily: "Poppins-Regular",
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color} // use system color
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "cube" : "cube-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Sell"
        options={{
          title: "Sell",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="More"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? "ellipsis-horizontal-circle"
                  : "ellipsis-horizontal-circle-outline"
              }
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default MainLayout;
