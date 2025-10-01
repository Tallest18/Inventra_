import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Sell = () => {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const handleSell = () => {
    // Logic for selling an item
    console.log("Selling:", { productName, quantity, price });
    // Reset form
    setProductName("");
    setQuantity("");
    setPrice("");
    alert("Item sold!");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quick Sell</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add an Item to Sell</Text>

          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Coca-Cola 50cl"
            value={productName}
            onChangeText={setProductName}
          />

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.label}>Total Price (₦)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2500"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <TouchableOpacity style={styles.sellButton} onPress={handleSell}>
            <Text style={styles.sellButtonText}>Sell</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  sellButton: {
    backgroundColor: "#2046AE",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  sellButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
export default Sell;
