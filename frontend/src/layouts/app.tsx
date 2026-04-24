import { Outlet } from "@tanstack/react-router";
import { LoginProvider } from "../providers/login";
import { ApiErrorHandler } from "../components/error/apiErrorHandler";
import { GlobalErrorHandler } from "../components/error/globalErrorHandler";

export const AppLayout = () => {
  return (
    <LoginProvider>
      <GlobalErrorHandler />
      <ApiErrorHandler />
      <div style={{ minHeight: "100vh", background: "#0b0f1a" }}>
        <Outlet />
      </div>
    </LoginProvider>
  );
};
