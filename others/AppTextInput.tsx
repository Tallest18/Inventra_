// src/components/AppTextInput.tsx
import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

const AppTextInput: React.FC<TextInputProps> = ({ style, ...props }) => {
  return <TextInput {...props} style={[styles.input, style]} />;
};

const styles = StyleSheet.create({
  input: {
    fontFamily: "Poppins",
  },
});

export default AppTextInput;
