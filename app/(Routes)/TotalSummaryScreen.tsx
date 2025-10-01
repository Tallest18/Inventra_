// screens/TotalSummaryScreen.tsx
import React from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";

const TotalSummaryScreen = () => {
  // Sales history will come dynamically from backend
  const sales: {
    image: string;
    name: string;
    quantity: number;
    date: string;
    amount: number;
  }[] = [];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Total Sales Summary</Text>

      <FlatList
        data={sales}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.saleItem}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.name}>
                {item.name} x{item.quantity}
              </Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <Text style={styles.amount}>₦{item.amount}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No sales recorded yet</Text>
        }
      />
    </View>
  );
};

export default TotalSummaryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9FAFB",
    marginTop: 30,
  },
  header: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  saleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  image: { width: 40, height: 40, borderRadius: 6 },
  name: { fontWeight: "600" },
  date: { fontSize: 12, color: "#777" },
  amount: { fontWeight: "600" },
  empty: { textAlign: "center", color: "#777", marginTop: 20 },
});
