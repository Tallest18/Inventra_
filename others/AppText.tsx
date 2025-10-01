// src/components/AppText.tsx
import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

const AppText: React.FC<TextProps> = ({ style, ...props }) => {
  return <Text {...props} style={[styles.text, style]} />;
};

const styles = StyleSheet.create({
  text: {
    fontFamily: "Poppins", // default font
  },
});

export default AppText;
