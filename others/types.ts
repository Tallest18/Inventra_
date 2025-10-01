// src/types.ts

export type AppStackParamList = {
  Welcome: undefined; // no params passed to WelcomeScreen
  Verification: {
    verificationId: string;
    phoneNumber: string;
  };
};
