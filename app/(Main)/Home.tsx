// app/(Main)/Home.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc, // <-- CHANGED: Import for correct type
  DocumentData,
  getDoc,
  onSnapshot,
  orderBy,
  query, // <-- ADDED: For adding documents (New Product)
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AddProductFlow from "../(Routes)/AddProductFlow";
import { auth, db } from "../config/firebaseConfig";

const { width } = Dimensions.get("window");

// Updated Notification type to match the data structure from the backend
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
  productId?: string;
  dateAdded: number; // Added for sorting
}

// Fixed Product type definition
interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  image?: {
    uri: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
  } | null;
  quantityType: string;
  unitsInStock: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  expiryDate: string;
  supplier: {
    name: string;
    phone: string;
  };
  dateAdded: string;
  userId: string;
}

// Added this interface to fix the salesSummary errors
interface SalesSummaryItem {
  id: string;
  image?: string;
  name: string;
  quantity: number;
  date: string;
  amount: number;
  profit: number; // assuming profit is also part of a sale
}

const Home = () => {
  const router = useRouter();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [userData, setUserData] = useState({
    name: "",
    profileImage: "",
    todaySales: 0,
    profit: 0,
    transactions: 0,
    stockLeft: 0,
    salesSummary: [] as SalesSummaryItem[], // Explicitly typed as SalesSummaryItem[]
  });

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  const handleAddProduct = async (productData: Omit<Product, "id">) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "Please log in to add products");
        return;
      }

      // 1. Prepare the data for Firestore
      const newProductData = {
        ...productData,
        userId: currentUser.uid,
        dateAdded: new Date().toISOString(), // Use consistent date format for Product
        createdAt: new Date(), // Additional timestamp for backend
      };

      // 2. Corrected line for adding a document with modular SDK (v9)
      const docRef = await addDoc(collection(db, "products"), newProductData);

      // 3. Update local state with the new product including the generated ID
      const newProductWithId: Product = { ...newProductData, id: docRef.id };
      setInventory((prev: Product[]) => [...prev, newProductWithId]);

      setUserData((prev) => ({
        ...prev,
        stockLeft: prev.stockLeft + (newProductData.unitsInStock || 0),
      }));

      Alert.alert("Success", "Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Fetch user profile data
    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        setUserData((prev) => ({
          ...prev,
          name: profile?.name || currentUser.phoneNumber || "User",
          profileImage:
            profile?.profileImage || "https://via.placeholder.com/40",
        }));
      }
    };
    fetchUserData();

    // Set up real-time listener for sales summary
    const salesQuery = query(
      collection(db, "sales"),
      where("userId", "==", currentUser.uid)
    );
    const unsubscribeSales = onSnapshot(salesQuery, (querySnapshot) => {
      let totalSales = 0;
      let totalProfit = 0;
      const salesSummary: SalesSummaryItem[] = [];

      querySnapshot.forEach(
        // Corrected type for modular SDK snapshot
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const sale = { id: doc.id, ...doc.data() } as SalesSummaryItem;
          totalSales += sale.amount || 0;
          totalProfit += sale.profit || 0;
          salesSummary.push(sale);
        }
      );

      setUserData((prev) => ({
        // This is the corrected line
        ...prev,
        todaySales: totalSales,
        profit: totalProfit,
        transactions: salesSummary.length,
        salesSummary,
      }));
    });

    // Set up real-time listener for inventory/stock
    const productsQuery = query(
      collection(db, "products"),
      where("userId", "==", currentUser.uid)
    );
    const unsubscribeProducts = onSnapshot(productsQuery, (productsSnap) => {
      let totalStock = 0;
      const inventoryProducts: Product[] = [];

      productsSnap.forEach(
        // Corrected type for modular SDK snapshot
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const productData = { id: doc.id, ...doc.data() } as Product;
          totalStock += productData.unitsInStock || 0;
          inventoryProducts.push(productData);
        }
      );

      setInventory(inventoryProducts);
      setUserData((prev) => ({
        ...prev,
        stockLeft: totalStock,
      }));
    });

    // Set up real-time listener for notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      orderBy("dateAdded", "desc")
    );
    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const fetchedNotifications: Notification[] = [];
        snapshot.forEach(
          // Corrected type for modular SDK snapshot
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            fetchedNotifications.push({
              id: doc.id,
              ...doc.data(),
            } as Notification);
          }
        );
        setNotifications(fetchedNotifications);
      },
      (error) => {
        console.error("Firestore error:", error);
      }
    );

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
      unsubscribeNotifications();
    };
  }, []);

  // Helper function to get the correct icon based on notification type
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
        return <Feather name="alert-circle" size={20} color="#FF8C42" />;
      case "high_selling":
        return <Feather name="trending-up" size={20} color="#4CAF50" />;
      case "expiry":
        return <Feather name="calendar" size={20} color="#F59E0B" />;
      case "daily_summary":
      case "weekly_summary":
        return <Feather name="bar-chart-2" size={20} color="#3B82F6" />;
      default:
        return <Ionicons name="notifications-outline" size={20} color="#666" />;
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Hello,</Text>
          <Text style={styles.username}>{userData.name}</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => router.push("/(Routes)/NotificationsScreen")}
          >
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(Routes)/MessagesScreen")}
          >
            <Feather name="message-square" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (auth.currentUser) {
                router.push("/(Routes)/Profile");
              }
            }}
          >
            <Image
              source={{
                uri: userData.profileImage || "https://via.placeholder.com/40",
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.salesBox}>
        <View style={styles.salesTop}>
          <Text style={styles.salesAmount}>
            ₦{userData.todaySales.toFixed(2)}
          </Text>
          <Text style={styles.salesRate}>+6.5%</Text>
        </View>
        <View style={styles.profitBox}>
          <Text style={styles.profitLabel}>Profit</Text>
          <Text style={styles.profitAmount}>₦{userData.profit.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.infoBox}>
          <Text style={styles.infoValue}>{userData.transactions}</Text>
          <Text style={styles.infoLabel}>Transactions</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoValue}>{userData.stockLeft} Items</Text>
          <Text style={styles.infoLabel}>Stock Left</Text>
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: "#001F54" }]}
          onPress={() => setShowAddProduct(true)}
        >
          <Text style={styles.actionText}>New Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: "#0056D2" }]}
          onPress={() => router.push("/(Routes)/QuickSellScreen")}
        >
          <Text style={styles.actionText}>Quick Sell</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sales Summary</Text>
        <TouchableOpacity
          onPress={() => router.push("/(Routes)/TotalSummaryScreen")}
        >
          <Feather name="arrow-right" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderFooter = () => (
    <View style={{ marginTop: 20, paddingLeft: 10 }}>
      <View style={styles.notificationHeader}>
        <Text style={styles.sectionTitle}>Notification Summary</Text>
        <TouchableOpacity
          onPress={() => router.push("/(Routes)/NotificationsScreen")}
        >
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications.slice(0, 3)} // Displaying only the 3 most recent notifications
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.notificationItem}
            onPress={() =>
              router.push({
                pathname: "/(Routes)/NotificationDetails" as any,
                params: { notification: JSON.stringify(item) },
              })
            }
          >
            <View style={styles.notifIconContainer}>
              {getNotificationIcon(item.type)}
            </View>
            <View style={styles.notifTextContainer}>
              <Text style={styles.notificationText}>{item.message}</Text>
              <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No recent updates</Text>
        }
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={userData.salesSummary}
        keyExtractor={(item) => item.id} // use the id from the SalesSummaryItem interface
        renderItem={({ item }) => (
          <View style={styles.saleItem}>
            <Image
              source={{
                uri: item.image || "https://via.placeholder.com/40",
              }}
              style={styles.saleImage}
            />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.saleName}>
                {item.name} x{item.quantity}
              </Text>
              <Text style={styles.saleDate}>{item.date}</Text>
            </View>
            <Text style={styles.saleAmount}>₦{item.amount}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { paddingHorizontal: 20 }]}>
            No sales recorded yet
          </Text>
        }
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <AddProductFlow
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSaveProduct={handleAddProduct}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  hello: { fontSize: 20, color: "#555", fontFamily: "Poppins-Regular" },
  username: { fontSize: 22, fontWeight: "600", fontFamily: "Poppins-Regular" },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#eee" },
  salesBox: {
    backgroundColor: "#0056D2",
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  salesTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  salesAmount: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "Poppins-Regular",
  },
  salesRate: {
    color: "#4ADE80",
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
  profitBox: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profitLabel: { color: "white" },
  profitAmount: { color: "white", fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
  },
  infoValue: { fontSize: 18, fontWeight: "600", fontFamily: "Poppins-Regular" },
  infoLabel: { color: "#777", marginTop: 4 },
  actionBox: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "white",
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: { fontSize: 20, fontWeight: "600", fontFamily: "Poppins-Bold" },
  saleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 20,
  },
  saleImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  saleName: { fontWeight: "600", fontFamily: "Poppins-Regular" },
  saleDate: { fontSize: 12, color: "#777", fontFamily: "Poppins-Regular" },
  saleAmount: { fontWeight: "600", fontFamily: "Poppins-Regular" },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
    fontFamily: "Poppins-Regular",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 10,
    marginTop: 30,
  },
  viewAll: {
    color: "#0056D2",
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    fontSize: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    marginRight: 10,
  },
  notifIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E7EEFA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notifTextContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
  notificationTime: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
});

export default Home;
