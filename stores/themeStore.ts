import { create } from "zustand";

// Interface for the theme state
interface ThemeState {
  isDarkMode: boolean;
  themeColor: string;
  toggleTheme: () => void;
  setThemeColor: (color: string) => void;
}

// Create the theme store using zustand
const useThemeStore = create<ThemeState>((set) => ({
  // Initial state values
  isDarkMode: false,
  themeColor: "#007AFF", // Default blue color

  // Action to toggle dark mode
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Action to set a new theme color
  setThemeColor: (color: string) => set(() => ({ themeColor: color })),
}));

export default useThemeStore;
