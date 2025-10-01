import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebaseConfig";

// Notification type (same as NotificationsScreen/Home)
interface Notification {
  id: string;
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
    | "app_update"
    | "product_added"
    | "sale"
    | "general";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  productId?: string;
  dateAdded: number;
}

const NotificationDetails = () => {
  const router = useRouter();
  const { notification } = useLocalSearchParams();
  const parsedNotification: Notification = JSON.parse(notification as string);

  // ✅ Mark notification as read when opened
  useEffect(() => {
    const markAsRead = async () => {
      try {
        if (!parsedNotification.isRead) {
          await updateDoc(doc(db, "notifications", parsedNotification.id), {
            isRead: true,
          });
        }
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    };

    markAsRead();
  }, []);

  const getNotificationColor = () => {
    switch (parsedNotification.type) {
      case "low_stock":
      case "out_of_stock":
        return "#FF8C42";
      case "high_selling":
        return "#4CAF50";
      case "expiry":
        return "#D97706";
      case "daily_summary":
      case "weekly_summary":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Details</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[styles.mainCard, { backgroundColor: getNotificationColor() }]}
        >
          <Text style={styles.notificationType}>
            {parsedNotification.title}
          </Text>
          <Text style={styles.notificationTitle}>
            {parsedNotification.message}
          </Text>
          <Text style={styles.notificationTime}>{parsedNotification.time}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5", paddingTop: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  backButton: { marginRight: 10, padding: 5 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Poppins-Bold",
  },
  content: { flex: 1, padding: 20 },
  mainCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  notificationType: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontFamily: "Poppins-Bold",
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  notificationTime: {
    marginTop: 8,
    fontSize: 14,
    color: "#f0f0f0",
    fontFamily: "Poppins-Regular",
  },
});

export default NotificationDetails;
