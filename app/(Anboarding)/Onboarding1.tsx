import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const Onboarding1 = () => {
  useEffect(() => {
    // Navigate to the onboarding screen after 3 seconds
    const timer = setTimeout(() => {
      router.replace("/(Auth)/WelcomeScreen");
    }, 3000);

    return () => clearTimeout(timer); // Clean up the timer on unmount
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.title}>Inventra</Text>
        <Text style={styles.subtitle}>Inventory Management System</Text>
      </View>

      <View style={styles.logoContainer}>
        <Text style={styles.fromText}>From</Text>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Image
              source={require("../../assets/images/Logo White.png")}
              style={styles.image}
            />
          </View>
          <Text style={styles.logoText}> Wonderfall</Text>
        </View>
        <Text style={styles.systemsText}> S Y S T E M S</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2046AE",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 80,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 64,
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "300",
    fontFamily: "Poppins-Regular",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  fromText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 2,
    fontFamily: "Poppins-Regular",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  logoIconText: {
    color: "#2046AE",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Poppins-Regular",
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    letterSpacing: 1,
  },
  systemsText: {
    color: "#fff",
    fontSize: 16,
    letterSpacing: 6,
    fontWeight: "300",
    marginLeft: 30,
    fontFamily: "Poppins-Regular",
  },
  image: {
    height: 28,
    width: 28,
  },
});
export default Onboarding1;
