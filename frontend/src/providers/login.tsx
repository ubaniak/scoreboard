import React, { createContext, useContext } from "react";

type LoginContextType = {
  role: string;
  token: string;
};

const LoginContext = createContext<LoginContextType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const LoginProvider: React.FC<Props> = ({ children }) => {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (role === null || token === null) {
    return <>div</>;
  }

  const values: LoginContextType = {
    role: role || "",
    token: token || "",
  };
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
