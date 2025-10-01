import { NavigatorScreenParams } from "@react-navigation/native";

// Define the types for your main app's bottom tabs
export type MainTabParamList = {
  Home: undefined;
  Inventory: undefined;
  Sell: undefined;
  Finance: undefined;
  More: undefined;
};

// Define the types for your authentication and onboarding flow
export type AppStackParamList = {
  WelcomeScreen: undefined;

  Onboarding1: undefined;

  VerificationScreen: {
    verificationId: string;
    phoneNumber: string;
    isTestMode?: boolean;
    onVerificationSuccess: () => void;
    onGoBack: () => void;
  };

  BusinessSelectionScreen: {
    onFinish: (businessType: string) => void;
  };

  Notifications: undefined;
  TotalSummary: undefined;
  NewProduct: undefined;
  QuickSell: undefined;
  Messages: undefined;
  SettingsScreen: undefined;
  Profile: { userId: string };
  NotificationScreen: { email: string };
  NotificationDetails: undefined;
  ProductDetails: undefined;

  "(Main)": NavigatorScreenParams<MainTabParamList>;
  "(Auth)": undefined;
  "(Anboarding)": undefined;
};
