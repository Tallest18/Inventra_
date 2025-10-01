import React, { createContext, ReactNode, useState } from "react";

// Types
interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<AuthResult>;
  socialLogin: (
    provider: "google" | "facebook",
    userData: { name: string; email: string }
  ) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  logout: () => void;
  isLoading: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Auth Context
export const AuthContext = createContext<AuthContextType | null>(null);

// Mock user database (in real app, this would be your backend)
const mockUsers: Array<User & { password: string }> = [
  {
    id: 1,
    email: "test@example.com",
    password: "password123",
    name: "John Doe",
  },
];

// Auth Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Find user in mock database
      const foundUser = mockUsers.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password
      );

      if (foundUser) {
        // Remove password from user object before setting state
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: "Invalid email or password" };
      }
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if user already exists
      const existingUser = mockUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        setIsLoading(false);
        return {
          success: false,
          error: "An account with this email already exists",
        };
      }

      // Create new user
      const newUser = {
        id: mockUsers.length + 1,
        email: email.toLowerCase(),
        password,
        name: fullName,
      };

      // Add to mock database
      mockUsers.push(newUser);

      // Remove password from user object before setting state
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      setIsLoading(false);

      return {
        success: true,
        message: "Account created successfully!",
      };
    } catch (error) {
      setIsLoading(false);
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }
  };

  const socialLogin = async (
    provider: "google" | "facebook",
    userData: { name: string; email: string }
  ): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user exists, if not create new user
      let foundUser = mockUsers.find(
        (u) => u.email.toLowerCase() === userData.email.toLowerCase()
      );

      if (!foundUser) {
        // Create new user for social login
        const newUser = {
          id: mockUsers.length + 1,
          email: userData.email.toLowerCase(),
          password: "", // Social users don't have passwords
          name: userData.name,
        };
        mockUsers.push(newUser);
        foundUser = newUser;
      }

      // Remove password from user object before setting state
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      setIsLoading(false);

      return {
        success: true,
        message: `Successfully signed in with ${provider}!`,
      };
    } catch (error) {
      setIsLoading(false);
      return {
        success: false,
        error: `${provider} sign-in failed. Please try again.`,
      };
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if email exists in database
      const foundUser = mockUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      setIsLoading(false);

      if (foundUser) {
        return {
          success: true,
          message: "Password reset link sent to your email",
        };
      } else {
        return {
          success: false,
          error: "No account found with this email address",
        };
      }
    } catch (error) {
      setIsLoading(false);
      return {
        success: false,
        error: "Failed to send reset email. Please try again.",
      };
    }
  };

  const logout = (): void => {
    setUser(null);
  };

  // Computed property for authentication status
  const isAuthenticated = user !== null;

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    register,
    socialLogin,
    forgotPassword,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export types for use in other components
export type { AuthResult, User };
