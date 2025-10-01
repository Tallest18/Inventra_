// app/(routes)/BusinessSelectionScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BusinessType {
  id: string;
  title: string;
  description: string;
}

const businessTypes: BusinessType[] = [
  {
    id: "retail",
    title: "Retail Shop",
    description:
      "For supermarkets, provision stores, boutiques, pharmacies, and other product sellers.",
  },
  {
    id: "service",
    title: "Service Business",
    description:
      "For salons, barbers, tailors, mechanics, and similar service providers.",
  },
];

export interface BusinessSelectionExtraProps {
  onFinish?: (businessType: string) => void;
  onGoBack?: () => void;
}

const BusinessSelectionScreen: React.FC<BusinessSelectionExtraProps> = ({
  onFinish,
  onGoBack,
}) => {
  const navigation = useNavigation<any>();
  const [selectedType, setSelectedType] = useState<string>("retail");
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (onFinish) {
        onFinish(selectedType);
        return;
      }

      // Save onboarding info
      await Promise.all([
        AsyncStorage.setItem("businessType", selectedType),
        AsyncStorage.setItem("hasCompletedOnboarding", "true"),
      ]);

      // Navigate
      try {
        router.replace("/(Main)/Home");
      } catch {
        try {
          router.push("/(Main)/Home");
        } catch {
          if (navigation) {
            navigation.reset({
              index: 0,
              routes: [{ name: "Main" }],
            });
          }
        }
      }
    } catch (error) {
      console.error("Error saving business type:", error);
      Alert.alert("Setup Complete", "Welcome to Inventra!", [
        {
          text: "Continue",
          onPress: () => {
            try {
              router.replace("/(Main)/Home");
            } catch {
              if (navigation) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Main" }],
                });
              }
            }
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const renderBusinessOption = (business: BusinessType) => {
    const isSelected = selectedType === business.id;
    const isRetail = business.id === "retail";

    return (
      <TouchableOpacity
        key={business.id}
        style={[
          styles.businessOption,
          isSelected && styles.selectedOption,
          loading && styles.disabled,
        ]}
        onPress={() => !loading && setSelectedType(business.id)}
        disabled={loading}
        activeOpacity={0.7}
      >
        <View style={styles.businessContent}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessTitle}>{business.title}</Text>
            <Text style={styles.businessDescription}>
              {business.description}
            </Text>
          </View>

          <View style={styles.businessIcon}>
            {isRetail ? (
              <View style={styles.cartIcon}>
                <View style={styles.cartBody} />
                <View style={styles.cartHandle} />
                <View style={[styles.cartWheel, styles.cartWheel1]} />
                <View style={[styles.cartWheel, styles.cartWheel2]} />
              </View>
            ) : (
              <View style={styles.serviceIcon}>
                <View style={styles.person1} />
                <View style={styles.person2} />
              </View>
            )}
          </View>
        </View>
        {isSelected && <View style={styles.selectionIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2046AE" />

      <View style={styles.topSection} />

      <View style={styles.bottomSection}>
        <View style={styles.handleBar} />

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.formContainer}>
            <Text style={styles.successText}>You are in!</Text>
            <Text style={styles.title}>Choose One</Text>
            <Text style={styles.subtitle}>
              To maximize your experience of Inventra,{"\n"}tell us what you
              want to do!
            </Text>

            <Text style={styles.sectionTitle}>Choose your business type</Text>

            <View style={styles.optionsContainer}>
              {businessTypes.map(renderBusinessOption)}
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.finishButton, loading && styles.disabled]}
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.finishButtonText}>Finish</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2046AE" />
            <Text style={styles.loadingText}>Setting up your account...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2046AE" },
  topSection: { height: 350 },
  bottomSection: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    flex: 1,
  },
  handleBar: {
    width: 80,
    height: 4,
    backgroundColor: "black",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  formContainer: { paddingHorizontal: 24, minHeight: 400 },
  successText: {
    fontSize: 16,
    color: "#2046AE",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Poppins-Bold",
  },
  title: {
    fontSize: 30,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: "Poppins-Regular",
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 16,
  },
  optionsContainer: { marginBottom: 20, gap: 12 },
  businessOption: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
    position: "relative",
    minHeight: 80,
  },
  selectedOption: {
    borderColor: "#2046AE",
    backgroundColor: "#F8FAFC",
  },
  businessContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
  },
  businessInfo: { flex: 1, paddingRight: 16 },
  businessTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    fontFamily: "Poppins-Regular",
  },
  businessIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  cartIcon: { width: 32, height: 24, position: "relative" },
  cartBody: {
    width: 28,
    height: 16,
    borderWidth: 2,
    borderColor: "#374151",
    backgroundColor: "#F3F4F6",
    borderRadius: 2,
    position: "absolute",
    top: 0,
    left: 2,
  },
  cartHandle: {
    width: 16,
    height: 12,
    borderWidth: 2,
    borderColor: "#374151",
    borderRadius: 4,
    borderBottomWidth: 0,
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: "transparent",
  },
  cartWheel: {
    width: 4,
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
    position: "absolute",
    bottom: -4,
  },
  cartWheel1: { left: 6 },
  cartWheel2: { right: 6 },
  serviceIcon: { width: 32, height: 24, position: "relative" },
  person1: {
    width: 12,
    height: 20,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    position: "absolute",
    left: 4,
    top: 2,
  },
  person2: {
    width: 12,
    height: 20,
    backgroundColor: "#3B82F6",
    borderRadius: 6,
    position: "absolute",
    right: 4,
    top: 2,
  },
  selectionIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: "#2046AE",
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "#FFFFFF",
  },
  finishButton: {
    backgroundColor: "#2046AE",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 54,
  },
  finishButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Poppins-Bold",
  },
  disabled: { opacity: 0.6 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    color: "#2046AE",
  },
});

export default BusinessSelectionScreen;
