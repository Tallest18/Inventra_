import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useThemeStore from "../../stores/themeStore";
import { auth, db } from "../config/firebaseConfig";

// Types
interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
  hasArrow?: boolean;
}

interface UserProfile {
  name: string;
  username: string;
}

// Reusable component for a single setting row
const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  text,
  onPress,
  hasArrow = true,
}) => {
  return (
    <TouchableOpacity style={itemStyles.container} onPress={onPress}>
      <View style={itemStyles.leftContent}>
        <Ionicons name={icon} size={24} color="#333" />
        <Text style={itemStyles.text}>{text}</Text>
      </View>
      {hasArrow && (
        <Ionicons name="chevron-forward-outline" size={24} color="#aaa" />
      )}
    </TouchableOpacity>
  );
};

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    marginLeft: 15,
  },
});

const SettingsScreen = () => {
  const { themeColor, isDarkMode, toggleTheme } = useThemeStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Handle user logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace("../../Onboarding1");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  // Fetch user profile data on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          // Assuming user profile data is stored in a 'users' collection
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setProfile({
              name: userData.name || "User's Name",
              username: userData.username || user.email || "username",
            });
          } else {
            // Fallback to Firebase Auth data if no profile doc exists
            setProfile({
              name: user.displayName || "User's Name",
              username: user.email || "username",
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile({
            name: user.displayName || "User's Name",
            username: user.email || "username",
          });
        }
      } else {
        setProfile(null); // Clear profile on logout
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity>
            <Ionicons name="search-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Ionicons name="person-circle-outline" size={80} color="#ddd" />
          <Text style={styles.name}>
            {profile ? profile.name : "User's Name"}
          </Text>
          <Text style={styles.username}>
            {profile ? `@${profile.username}` : "@username"}
          </Text>
        </View>

        <SettingItem
          icon="person-outline"
          text="Account"
          onPress={() => router.push("./AccountScreen" as any)}
        />
        <SettingItem
          icon="color-palette-outline"
          text="Theme"
          onPress={() => router.push("../../ThemeSelectionScreen" as any)}
        />
        <SettingItem
          icon="apps-outline"
          text="App"
          onPress={() => console.log("Go to app page")}
        />

        <View style={itemStyles.container}>
          <View style={itemStyles.leftContent}>
            <Ionicons name="moon-outline" size={24} color="#333" />
            <Text style={itemStyles.text}>Change Mode</Text>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: themeColor }}
            thumbColor={isDarkMode ? "#fff" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleTheme}
            value={isDarkMode}
          />
        </View>
        <SettingItem
          icon="lock-closed-outline"
          text="Privacy Policy"
          onPress={() => router.push("./PrivacyPolicyScreen" as any)}
        />
        <SettingItem
          icon="help-circle-outline"
          text="Help Center"
          onPress={() => router.push("./HelpCenterScreen" as any)}
        />
        <SettingItem
          icon="log-out-outline"
          text="Logout"
          onPress={handleLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  username: {
    fontSize: 14,
    color: "#aaa",
  },
});

export default SettingsScreen;
