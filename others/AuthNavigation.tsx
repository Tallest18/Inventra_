// app/others/AuthNavigation.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Screens (these accept optional extra props now)
import VerificationScreen from "../app/(Routes)/VerificationScreen";
import WelcomeScreen from "../app/(Routes)/WelcomeScreen";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQm0OOssxldFQWAZJju_AVMVCNYoF3mcY",
  authDomain: "wonderfall-3a49e.firebaseapp.com",
  projectId: "wonderfall-3a49e",
  storageBucket: "wonderfall-3a49e.firebasestorage.app",
  messagingSenderId: "474324497072",
  appId: "1:474324497072:android:d55a86f80589f51cab4175",
};

// Initialize Firebase
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

type AuthStep =
  | "loading"
  | "welcome"
  | "verification"
  | "business-selection"
  | "home";

interface AuthState {
  currentStep: AuthStep;
  verificationId: string;
  phoneNumber: string;
  user: User | null;
  businessType: string | null;
  isTestMode?: boolean;
}

const AuthNavigation: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    currentStep: "loading",
    verificationId: "",
    phoneNumber: "",
    user: null,
    businessType: null,
    isTestMode: false,
  });

  const auth = getAuth();

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      try {
        if (user) {
          const [hasCompletedOnboarding, businessType] = await Promise.all([
            AsyncStorage.getItem("hasCompletedOnboarding"),
            AsyncStorage.getItem("businessType"),
          ]);

          if (hasCompletedOnboarding === "true" && businessType) {
            setAuthState((prev) => ({
              ...prev,
              currentStep: "home",
              user,
              businessType,
            }));
          } else {
            setAuthState((prev) => ({
              ...prev,
              currentStep: "business-selection",
              user,
            }));
          }
        } else {
          setAuthState((prev) => ({
            ...prev,
            currentStep: "welcome",
            user: null,
            businessType: null,
            verificationId: "",
            phoneNumber: "",
            isTestMode: false,
          }));
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
        setAuthState((prev) => ({
          ...prev,
          currentStep: "welcome",
          user: null,
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [auth]);

  const handleNavigateToVerification = (
    verificationId: string,
    phoneNumber: string,
    isTestMode: boolean = false
  ) => {
    setAuthState((prev) => ({
      ...prev,
      verificationId,
      phoneNumber,
      currentStep: "verification",
      isTestMode,
    }));
  };

  const handleVerificationSuccess = () => {
    setAuthState((prev) => ({
      ...prev,
      currentStep: "business-selection",
    }));
  };

  const handleGoBackToWelcome = () => {
    setAuthState((prev) => ({
      ...prev,
      currentStep: "welcome",
      verificationId: "",
      phoneNumber: "",
      isTestMode: false,
    }));
  };

  const handleFinishOnboarding = async (businessType: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem("businessType", businessType),
        AsyncStorage.setItem("hasCompletedOnboarding", "true"),
      ]);

      setAuthState((prev) => ({
        ...prev,
        currentStep: "home",
        businessType,
      }));
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      Alert.alert(
        "Error",
        "Failed to save your business information. Please try again."
      );
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.multiRemove([
        "hasCompletedOnboarding",
        "businessType",
      ]);

      setAuthState({
        currentStep: "welcome",
        verificationId: "",
        phoneNumber: "",
        user: null,
        businessType: null,
        isTestMode: false,
      });
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  if (authState.currentStep === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2046AE" />
        <Text style={styles.loadingText}>Initializing Inventra...</Text>
      </View>
    );
  }

  switch (authState.currentStep) {
    case "welcome":
      return (
        <WelcomeScreen
          onNavigateToVerification={handleNavigateToVerification}
        />
      );

    case "verification":
      return (
        <VerificationScreen
          onSuccess={handleVerificationSuccess}
          onGoBack={handleGoBackToWelcome}
          // pass verification data directly to component as fallback; component will prioritize route.params when used in navigator
          // but AuthNavigation uses props so we pass them:
          // @ts-ignore TS will accept these because VerificationScreen expects optional props
          verificationId={authState.verificationId}
          phoneNumber={authState.phoneNumber}
          isTestMode={authState.isTestMode}
        />
      );

    case "business-selection":
      return (
        <View style={styles.centered}>
          <Text>Business Selection Screen Placeholder</Text>
          <TouchableOpacity
            style={styles.mockButton}
            onPress={() => handleFinishOnboarding("retail")}
          >
            <Text style={styles.mockButtonText}>Finish as Retail</Text>
          </TouchableOpacity>
        </View>
      );

    case "home":
      return (
        <View style={styles.centered}>
          <Text style={styles.welcomeHomeText}>🎉 Welcome to Inventra!</Text>
          <Text>Phone: {authState.phoneNumber}</Text>
          {authState.businessType && (
            <Text>Business Type: {authState.businessType}</Text>
          )}
          {authState.user && <Text>User ID: {authState.user.uid}</Text>}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      );

    default:
      return (
        <View style={styles.centered}>
          <Text>Something went wrong...</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              setAuthState((prev) => ({ ...prev, currentStep: "welcome" }))
            }
          >
            <Text style={styles.retryButtonText}>Restart</Text>
          </TouchableOpacity>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#6B7280" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcomeHomeText: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  logoutButton: {
    marginTop: 20,
    backgroundColor: "#EF4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButtonText: { color: "#FFF", fontWeight: "bold" },
  mockButton: {
    marginTop: 20,
    backgroundColor: "#2046AE",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  mockButtonText: { color: "#FFF", fontWeight: "600" },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#2046AE",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: "#FFF" },
});

export default AuthNavigation;
