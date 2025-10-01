// app/(routes)/VerificationScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import {
  ApplicationVerifier,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { AppStackParamList } from "../../src/navigation/types";
// ✅ import config along with auth
import { auth, config } from "../config/firebaseConfig";

export interface VerificationExtraProps {
  onSuccess?: () => void;
  onGoBack?: () => void;
  phoneNumber?: string;
  verificationId?: string;
}

const VerificationScreen: React.FC<VerificationExtraProps> = ({
  onSuccess,
  onGoBack,
  phoneNumber: propPhoneNumber,
  verificationId: propVerificationId,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppStackParamList, "VerificationScreen">>();
  const params = route?.params;
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  // Use props first, then route params, then defaults
  const phoneNumber = propPhoneNumber || params?.phoneNumber || "";
  const [verificationId, setVerificationId] = useState(
    propVerificationId || params?.verificationId || ""
  );

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((p) => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (value: string, index: number) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" || key === "Delete") {
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
    }
  };

  const verifyCode = async (verificationCode: string) => {
    if (loading || !verificationId) return;

    setLoading(true);

    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      await signInWithCredential(auth, credential);

      setLoading(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("./BusinessSelectionScreen");
      }
    } catch (error: any) {
      setLoading(false);
      console.error("Verification failed:", error);

      let errorMessage = "Invalid verification code. Please try again.";
      if (error.code === "auth/invalid-verification-code") {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (error.code === "auth/code-expired") {
        errorMessage =
          "Verification code has expired. Please request a new one.";
      } else if (error.code === "auth/session-expired") {
        errorMessage = "Session expired. Please go back and try again.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      }

      Alert.alert("Verification Failed", errorMessage);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const resendCode = async () => {
    if (resendTimer > 0 || resendLoading || !phoneNumber) return;

    if (!recaptchaVerifier.current) {
      Alert.alert("Error", "Verification system not ready. Please try again.");
      return;
    }

    setResendLoading(true);

    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const newVerificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current as ApplicationVerifier
      );

      setVerificationId(newVerificationId);
      setResendTimer(45);
      setResendLoading(false);
      Alert.alert("Success", "Verification code resent successfully!");
    } catch (error: any) {
      setResendLoading(false);
      console.error("Error resending code:", error);

      let errorMessage = "Failed to resend verification code.";
      if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.code === "auth/invalid-phone-number") {
        errorMessage =
          "Invalid phone number. Please go back and check your number.";
      } else if (error.code === "auth/quota-exceeded") {
        errorMessage = "SMS quota exceeded. Please try again later.";
      }

      Alert.alert("Error", errorMessage);
    }
  };

  const clearAllInputs = () => {
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2046AE" />

      {/* ✅ FIX: add firebaseConfig */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={config}
        attemptInvisibleVerification={true}
        appVerificationDisabledForTesting={false}
      />

      <View style={styles.topSection} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.bottomSection}
      >
        <View style={styles.handleBar} />

        <View style={styles.formContainer}>
          <Text style={styles.title}>Confirmation Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to {phoneNumber}
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                  loading && styles.codeInputDisabled,
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent: { key } }) =>
                  handleKeyPress(key, index)
                }
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
                editable={!loading}
                returnKeyType="next"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (code.some((d) => d === "") || loading) && styles.disabled,
            ]}
            onPress={() => verifyCode(code.join(""))}
            disabled={code.some((d) => d === "") || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.verifyText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.resendContainer,
                (resendTimer > 0 || resendLoading) && styles.disabled,
              ]}
              onPress={resendCode}
              disabled={resendTimer > 0 || resendLoading}
            >
              <Text
                style={[
                  styles.resendText,
                  (resendTimer > 0 || resendLoading) && styles.disabledText,
                ]}
              >
                {resendLoading
                  ? "Sending..."
                  : resendTimer > 0
                  ? `Didn't get the code? Resend in ${resendTimer}s`
                  : "Didn't get the code? Resend now"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAllInputs}
              disabled={loading}
            >
              <Text style={[styles.clearText, loading && styles.disabledText]}>
                Clear all
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.backButton, loading && styles.disabled]}
            onPress={handleGoBack}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={20} color="#2046AE" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2046AE" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2046AE" },
  topSection: { flex: 1 },
  bottomSection: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    minHeight: "60%",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 32,
  },
  formContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  title: {
    fontSize: 22,
    color: "#111827",
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
  subtitle: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: "Poppins-Regular",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    backgroundColor: "#FFFFFF",
    fontFamily: "Poppins-Regular",
  },
  codeInputFilled: { borderColor: "#10B981", backgroundColor: "#F0FDF4" },
  codeInputDisabled: { opacity: 0.6 },
  verifyButton: {
    backgroundColor: "#2046AE",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  verifyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Poppins-Regular",
  },
  actionsContainer: { marginBottom: 32 },
  resendContainer: { paddingVertical: 8, marginBottom: 8 },
  resendText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "left",
    fontFamily: "Poppins-Regular",
  },
  clearButton: { paddingVertical: 4 },
  clearText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "left",
    fontFamily: "Poppins-Regular",
  },
  disabled: { opacity: 0.6 },
  disabledText: { color: "#9CA3AF" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#2046AE",
    marginLeft: 8,
    fontWeight: "500",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: "#2046AE",
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
});

export default VerificationScreen;
