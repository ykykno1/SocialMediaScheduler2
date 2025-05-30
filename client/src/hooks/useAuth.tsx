import React, { createContext, ReactNode, useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "./use-toast";

// Define types directly here for now
type User = {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  accountType: 'free' | 'premium';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "התחברת בהצלחה!",
        description: `ברוך הבא, ${data.user.firstName || data.user.username}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message || "אימייל או סיסמה לא נכונים",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return await response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "נרשמת בהצלחה!",
        description: `ברוך הבא לשבת רובוט, ${data.user.firstName || data.user.username}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה ברישום",
        description: error.message || "לא ניתן ליצור את החשבון",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user) throw new Error("No user logged in");
      const response = await apiRequest("PUT", `/api/auth/user/${user.id}`, updates);
      return await response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "פרופיל עודכן",
        description: "הנתונים שלך נשמרו בהצלחה",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון",
        description: error.message || "לא ניתן לעדכן את הפרופיל",
        variant: "destructive",
      });
    },
  });

  const login = async (credentials: LoginData) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = () => {
    setUser(null);
    queryClient.clear();
    toast({
      title: "התנתקת בהצלחה",
      description: "שבת שלום!",
    });
  };

  const updateUser = async (updates: Partial<User>) => {
    await updateUserMutation.mutateAsync(updates);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: loginMutation.isPending || registerMutation.isPending,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}