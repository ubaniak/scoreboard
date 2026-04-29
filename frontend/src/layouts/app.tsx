import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginProvider } from "../providers/login";
import { ApiErrorHandler } from "../components/error/apiErrorHandler";
import { GlobalErrorHandler } from "../components/error/globalErrorHandler";
import { useSetupStatus } from "../api/setup";
import { useTheme } from "../theme";

export const AppLayout = () => {
  const { data: setupStatus } = useSetupStatus();
  const navigate = useNavigate();
  const { colors } = useTheme();

  useEffect(() => {
    if (setupStatus?.required) {
      navigate({ to: "/setup" });
    }
  }, [setupStatus, navigate]);

  return (
    <LoginProvider>
      <GlobalErrorHandler />
      <ApiErrorHandler />
      <div style={{ minHeight: "100vh", background: colors.bg }}>
        <Outlet />
      </div>
    </LoginProvider>
  );
};
