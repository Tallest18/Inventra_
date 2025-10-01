import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define a type for the options to ensure type safety for icon names
type Option = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
};
const More = () => {
  const options: Option[] = [
    {
      title: "My Account",
      icon: "person-circle-outline",
      action: () => {
        router.push("/(Routes)/AccountScreen");
      },
    },
    {
      title: "Notifications",
      icon: "notifications-outline",
      action: () => {
        router.push("/(Routes)/NotificationsScreen");
      },
    },
    {
      title: "Settings",
      icon: "settings-outline",
      action: () => {
        router.push("/(Routes)/SettingsScreen");
      },
    },
    {
      title: "Help & Support",
      icon: "help-circle-outline",
      action: () => {
        router.push("/(Routes)/HelpCenterScreen");
      },
    },
    {
      title: "Sign Out",
      icon: "log-out-outline",
      action: () => {
        // Corrected the navigation path to the absolute path from the app root
        router.replace("/(Anboarding)/Onboarding1");
      },
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
        </View>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionItem}
            onPress={option.action}
          >
            <Ionicons name={option.icon} size={24} color="#2046AE" />
            <Text style={styles.optionText}>{option.title}</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#888"
              style={styles.chevron}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  optionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
  chevron: {
    marginLeft: "auto",
  },
});
export default More;
