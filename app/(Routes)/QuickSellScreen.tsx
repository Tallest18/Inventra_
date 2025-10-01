// screens/QuickSellScreen.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const QuickSellScreen = () => {
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");

  const handleQuickSell = () => {
    // API call for quick sale
    console.log({ product, quantity, price });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quick Sell</Text>

      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={product}
        onChangeText={setProduct}
      />
      <TextInput
        style={styles.input}
        placeholder="Quantity"
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <TouchableOpacity style={styles.button} onPress={handleQuickSell}>
        <Text style={styles.buttonText}>Confirm Sale</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9FAFB",
    marginTop: 30,
  },
  header: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  button: {
    backgroundColor: "#001F54",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
});
export default QuickSellScreen;
