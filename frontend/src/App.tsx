import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import "./App.css";
import { AppLayout } from "./layouts/app";
import { CardPage } from "./pages/card";
import { HomePage } from "./pages/home";
import { JudgePage } from "./pages/judge";
import { LoginPage } from "./pages/login";
import { SupervisorPage } from "./pages/supervisor";
import { NotificationProvider } from "./providers/notification";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: true,
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
    path: "/login",
    component: LoginPage,
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
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <QueryClientProvider client={queryClient}>
              <RouterProvider router={router}></RouterProvider>
            </QueryClientProvider>
          </LocalizationProvider>
        </NotificationProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
