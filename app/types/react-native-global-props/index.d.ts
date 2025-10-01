declare module "react-native-global-props" {
  import { TextInputProps, TextProps } from "react-native";

  /**
   * Set default props for all Text components in the app.
   * Example: setCustomText({ style: { fontFamily: "Poppins" } });
   */
  export function setCustomText(customProps: TextProps): void;

  /**
   * Set default props for all TextInput components in the app.
   * Example: setCustomTextInput({ style: { fontFamily: "Poppins" } });
   */
  export function setCustomTextInput(customProps: TextInputProps): void;
}
