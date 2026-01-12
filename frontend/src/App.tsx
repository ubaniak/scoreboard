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
  RouterProvider,
} from "@tanstack/react-router";
import { App as AntApp, ConfigProvider, theme } from "antd";
import "./App.css";
import { GlobalErrorHandler } from "./components/error/globalErrorHandler";
import { AppLayout } from "./layouts/app";
import { BoutPage } from "./pages/bout";
import { CardPage } from "./pages/card";
import { HomePage } from "./pages/home";
import { LoginPage } from "./pages/login";
import BoutDetailsPage from "./pages/test";
import { getEmitter, registerEmitter } from "./events/events";
import { ApiError } from "./api/fetchClient";
import { JudgePage } from "./pages/judge";

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
    path: "/card/$cardId/bout/$boutId",
    component: BoutPage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/card/test",
    component: BoutDetailsPage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/judge",
    component: JudgePage,
  }),
  // createRoute({
  //   getParentRoute: () => rootRoute,
  //   path: "/supervisor/$Id",
  //   component: SupervisorPage,
  // }),
]);

const router = createRouter({ routeTree });

function App() {
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

  return (
    <>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
        }}
      >
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <GlobalErrorHandler />
            <RouterProvider router={router}></RouterProvider>
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>
    </>
  );
}

export default App;
