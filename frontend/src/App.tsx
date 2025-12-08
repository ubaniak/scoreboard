import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "./providers/notification";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { HomePage } from "./pages/home";
import { CardPage } from "./pages/card";
import { JudgePage } from "./pages/judge";
import { SupervisorPage } from "./pages/supervisor";
import "./App.css";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

const rootRoute = createRootRoute({
  component: () => <AppLayout />,
});

const routeTree = rootRoute.addChildren([
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: HomePage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/card/$cardId",
    component: CardPage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/judge/$Id",
    component: JudgePage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/supervisor/$Id",
    component: SupervisorPage,
  }),
]);

const router = createRouter({ routeTree });
// theme.ts
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AppLayout } from "./layouts/app";
import { LoginProvider } from "./providers/login";

const theme = createTheme({
  palette: {
    // mode: "dark", // optional, but gray-600 looks better in dark mode
    background: {
      default: "#374151",
      // paper: "#374151",
    },
    text: {
      primary: "#000000", // regular text = black (overrides dark mode default)
    },
    primary: {
      main: "#fbbf24", // yellow-500 → your gold/highlight color
    },
  },
});

function App() {
  const queryClient = makeQueryClient();
  return (
    <>
      <LoginProvider>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
              </QueryClientProvider>
            </LocalizationProvider>
          </NotificationProvider>
        </ThemeProvider>
      </LoginProvider>
    </>
  );
}

export default App;
