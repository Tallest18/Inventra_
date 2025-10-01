declare module "firebase/auth/react-native" {
  import { AuthPersistence } from "firebase/auth";

  // declare the missing function
  export function getReactNativePersistence(storage: any): AuthPersistence;
}
