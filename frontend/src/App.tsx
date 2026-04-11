import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { App as AntApp, ConfigProvider, theme } from "antd";
import { TimerProvider } from "./providers/timer";
import { ApiError } from "./api/fetchClient";
import "./App.css";
import { getEmitter, registerEmitter } from "./events/events";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { AppLayout } from "./layouts/app";
import { BoutPage } from "./pages/bout";
import { CardPage } from "./pages/card";
import { HomePage } from "./pages/home";
import { JudgePage } from "./pages/judge";
import { LoginPage } from "./pages/login";
import { ScoreboardPage } from "./pages/scoreboard";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Pathless layout for protected routes (no path = no duplicate with root "/").
// Child paths are full paths so useParams({ from: "/card/$cardId" }) resolves.
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: AppLayout,
});

// Public routes (no token required) – direct children of root
const scoreboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scoreboard",
  component: ScoreboardPage,
});

const routeTree = rootRoute.addChildren([
  protectedLayoutRoute.addChildren([
    createRoute({
      getParentRoute: () => protectedLayoutRoute,
      path: "/",
      component: HomePage,
    }),
    createRoute({
      getParentRoute: () => protectedLayoutRoute,
      path: "/login",
      component: LoginPage,
    }),
    createRoute({
      getParentRoute: () => protectedLayoutRoute,
      path: "/card/$cardId",
      component: CardPage,
    }),
    createRoute({
      getParentRoute: () => protectedLayoutRoute,
      path: "/card/$cardId/bout/$boutId",
      component: BoutPage,
    }),
    createRoute({
      getParentRoute: () => protectedLayoutRoute,
      path: "/judge",
      component: JudgePage,
    }),
  ]),
  scoreboardRoute,
  // createRoute({
  //   getParentRoute: () => rootRoute,
  //   path: "/supervisor/$Id",
  //   component: SupervisorPage,
  // }),
]);

const router = createRouter({ routeTree });

registerEmitter<Error>("errors");
registerEmitter<ApiError>("apiErrors");
const errorsBus = getEmitter("errors");
const apiErrorBus = getEmitter("apiErrors");

const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof ApiError) {
          apiErrorBus.emit(error);
        } else {
          errorsBus.emit(error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof ApiError) {
          apiErrorBus.emit(error);
        } else {
          errorsBus.emit(error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: false,
      },
    },
});

function App() {
  return (
    <>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorBgBase: "#0b0f1a",
          },
        }}
      >
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <TimerProvider>
              <ErrorBoundary>
                <RouterProvider router={router}></RouterProvider>
              </ErrorBoundary>
            </TimerProvider>
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>
    </>
  );
}

export default App;
