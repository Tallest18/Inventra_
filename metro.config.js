// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// This is a fix for the `@react-native-firebase` module resolution error
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@react-native-firebase/app": path.resolve(__dirname, 'node_modules/@react-native-firebase/app/lib/common/index.js'),
};

module.exports = config;