// screens/NotificationsScreen.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import {
  collection,
  // REMOVED: FirebaseFirestoreTypes - Use modular types instead
  onSnapshot,
  orderBy,
  query,
  // ADDED: QueryDocumentSnapshot for correct modular type usage
  QueryDocumentSnapshot,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebaseConfig"; // Assuming you have firebaseConfig.ts

// Define the type for the notification data.
interface Notification {
  id: string; // Changed to string to match Firestore document ID
  type:
    | "low_stock"
    | "out_of_stock"
    | "high_selling"
    | "zero_sales"
    | "daily_summary"
    | "weekly_summary"
    | "expense"
    | "expiry"
    | "backup"
    | "app_update";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  productId?: string; // Changed to string
  dateAdded: number; // Added for sorting
}

// Define the navigation stack parameter list for type safety.
type RootStackParamList = {
  notifications: undefined;
  notificationDetails: { notification: Notification };
  inventory: undefined;
};

type NotificationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "notifications"
>;

const NotificationsScreen = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  useEffect(() => {
    // Reference to the notifications collection in Firestore
    const notificationsCollection = collection(db, "notifications");
    const notificationsQuery = query(
      notificationsCollection,
      orderBy("dateAdded", "desc")
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const fetchedNotifications: Notification[] = [];
        snapshot.forEach(
          // CORRECTED: Use QueryDocumentSnapshot from 'firebase/firestore'
          (doc: QueryDocumentSnapshot) => {
            const data = doc.data();
            fetchedNotifications.push({
              id: doc.id,
              ...data,
            } as Notification);
          }
        );
        setNotifications(fetchedNotifications);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, []);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
        return <Feather name="alert-circle" size={24} color="#FF8C42" />;
      case "high_selling":
        return <Feather name="trending-up" size={24} color="#4CAF50" />;
      case "expiry":
        return <Feather name="calendar" size={24} color="#F59E0B" />;
      case "daily_summary":
      case "weekly_summary":
        return <Feather name="bar-chart-2" size={24} color="#3B82F6" />;
      default:
        return <Ionicons name="notifications-outline" size={24} color="#666" />;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: item.isRead ? "#F8F9FA" : "#E8F0FF" },
      ]}
      onPress={() =>
        navigation.navigate("notificationDetails", { notification: item })
      }
    >
      <View style={styles.iconContainer}>{getNotificationIcon(item.type)}</View>
      <View style={styles.textContainer}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          {/* CORRECTED: Changed arrow-right to arrow-left for conventional back navigation */}
          <Feather name="x" size={20} color="black" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubText}>
              All your updates and alerts will show up here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC", // Changed to a slightly lighter blue
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  header: {
    flexDirection: "row", // Added to align items horizontally
    justifyContent: "space-between", // Added to push items to the ends
    alignItems: "center", // Added to vertically center
    paddingHorizontal: 20,
    paddingVertical: 15,

    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Poppins-Regular",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  notificationTime: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    fontFamily: "Poppins-Regular",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Poppins-Regular",
  },
});
export default NotificationsScreen;
