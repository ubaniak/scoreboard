import { useNavigate } from "@tanstack/react-router";
import React, { createContext, useContext, useState } from "react";

type LoginContextType = {
  role: string;
  token: string;
  setRole: (role: string) => void;
  setToken: (token: string) => void;
  clear: () => void;
};

const LoginContext = createContext<LoginContextType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const LoginProvider: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const roleFromLocal = localStorage.getItem("role");
  const tokenFromLocal = localStorage.getItem("token");
  const [role, setRole] = useState(roleFromLocal);
  const [token, setToken] = useState(tokenFromLocal);

  const values: LoginContextType = {
    role: role || "",
    token: token || "",
    setRole: (role: string) => {
      setRole(role);
      localStorage.setItem("role", role);
    },
    setToken: (token: string) => {
      setToken(token);
      localStorage.setItem("token", token);
    },
    clear: () => {
      localStorage.removeItem("role");
      localStorage.removeItem("token");
    },
  };

  if (!role || !token) {
    navigate({ to: "/login" });
  }

  return (
    <LoginContext.Provider value={values}>{children}</LoginContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useProfile = (): LoginContextType => {
  const context = useContext(LoginContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
