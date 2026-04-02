import { Outlet } from "@tanstack/react-router";
import { LoginProvider } from "../providers/login";
import { ApiErrorHandler } from "../components/error/apiErrorHandler";
import { GlobalErrorHandler } from "../components/error/globalErrorHandler";

export const AppLayout = () => {
  return (
    <LoginProvider>
      <GlobalErrorHandler />
      <ApiErrorHandler />
      <div style={{ padding: "20px 48px" }}>
        <Outlet />
      </div>
    </LoginProvider>
  );
};
