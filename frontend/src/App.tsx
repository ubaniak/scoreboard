import {
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
import "./App.css";
import { AppLayout } from "./layouts/app";
import { CardPage } from "./pages/card";
import { HomePage } from "./pages/home";
import { JudgePage } from "./pages/judge";
import { LoginPage } from "./pages/login";
import { SupervisorPage } from "./pages/supervisor";
import { App as AntApp } from "antd";
import { BoutPage } from "./pages/bout";

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        console.log(`Query Error --->>> ${error.message}`);
      },
    }),
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
    path: "/card/$cardId/bout/$boutId",
    component: BoutPage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/judge",
    component: JudgePage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/supervisor/$Id",
    component: SupervisorPage,
  }),
]);

const router = createRouter({ routeTree });

function App() {
  const queryClient = makeQueryClient();
  return (
    <>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router}></RouterProvider>
        </QueryClientProvider>
      </AntApp>
    </>
  );
}

export default App;
