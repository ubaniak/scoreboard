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
  lazyRouteComponent,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { App as AntApp, ConfigProvider, Spin, theme } from "antd";
import { TimerProvider } from "./providers/timer";
import { ThemeProvider } from "./providers/theme";
import { radius, useTheme } from "./theme";
import { ApiError } from "./api/fetchClient";
import "./App.css";
import { getEmitter, registerEmitter } from "./events/events";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { AppLayout } from "./layouts/app";
import { AdminShell } from "./layouts/adminShell";
import { HomePage } from "./pages/home";
import { SettingsPage } from "./pages/settings";

// Route pages are code-split — each is its own chunk, fetched on first
// navigation rather than bundled into the main entry.
const BoutPage = lazyRouteComponent(() => import("./pages/bout"), "BoutPage");
const CardPage = lazyRouteComponent(() => import("./pages/card"), "CardPage");
const CardActivityLogPage = lazyRouteComponent(() => import("./pages/card/activityLog"), "CardActivityLogPage");
const CardBoutsPage = lazyRouteComponent(() => import("./pages/card/bouts"), "CardBoutsPage");
const CardJudgeConsistencyPage = lazyRouteComponent(() => import("./pages/card/judgeConsistency"), "CardJudgeConsistencyPage");
const CardReportsPage = lazyRouteComponent(() => import("./pages/card/reports"), "CardReportsPage");
const HomeAffiliationsPage = lazyRouteComponent(() => import("./pages/home/affiliations"), "HomeAffiliationsPage");
const HomeAthletesPage = lazyRouteComponent(() => import("./pages/home/athletes"), "HomeAthletesPage");
const HomeOfficialsPage = lazyRouteComponent(() => import("./pages/home/officials"), "HomeOfficialsPage");
const SettingsDataPage = lazyRouteComponent(() => import("./pages/settings/data"), "SettingsDataPage");
const SettingsGoogleDrivePage = lazyRouteComponent(() => import("./pages/settings/googleDrive"), "SettingsGoogleDrivePage");
const JudgePage = lazyRouteComponent(() => import("./pages/judge"), "JudgePage");
const LoginPage = lazyRouteComponent(() => import("./pages/login"), "LoginPage");
const ScoreboardPage = lazyRouteComponent(() => import("./pages/scoreboard"), "ScoreboardPage");
const SetupPage = lazyRouteComponent(() => import("./pages/setup"), "SetupPage");

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

// Pathless layout nested under protected routes that adds the persistent
// GlobalNav shell. Login and Judge stay outside this so they render with no
// chrome (judges need a distraction-free full-screen scoring view).
const adminShellRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  id: "admin-shell",
  component: AdminShell,
});

// Public routes (no token required) – direct children of root
const scoreboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scoreboard",
  component: ScoreboardPage,
});

// Layout route for a single card — renders CardPage chrome (controls, next
// bout, tabs) and an <Outlet/> for whichever tab sub-route is active below.
const cardLayoutRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/card/$cardId",
  component: CardPage,
});

// Pathless layout route for Home — renders the Cards table + tabs chrome and
// an <Outlet/> for whichever entity tab sub-route is active below. Pathless
// (rather than path: "/") because a child at "/" under a parent that is
// ITSELF "/" collapses to the same route id and TanStack Router rejects it
// as a duplicate.
const homeLayoutRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  id: "home-layout",
  component: HomePage,
});

// Layout route for Settings — renders the tabs chrome and an <Outlet/> for
// whichever settings sub-route is active below.
const settingsLayoutRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  protectedLayoutRoute.addChildren([
    createRoute({
      getParentRoute: () => protectedLayoutRoute,
      path: "/login",
      component: LoginPage,
    }),
    createRoute({
      getParentRoute: () => protectedLayoutRoute,
      path: "/judge",
      component: JudgePage,
    }),
    adminShellRoute.addChildren([
      homeLayoutRoute.addChildren([
        createRoute({
          getParentRoute: () => homeLayoutRoute,
          path: "/",
          component: HomeAffiliationsPage,
        }),
        createRoute({
          getParentRoute: () => homeLayoutRoute,
          path: "/athletes",
          component: HomeAthletesPage,
        }),
        createRoute({
          getParentRoute: () => homeLayoutRoute,
          path: "/officials",
          component: HomeOfficialsPage,
        }),
      ]),
      cardLayoutRoute.addChildren([
        createRoute({
          getParentRoute: () => cardLayoutRoute,
          path: "/",
          component: CardBoutsPage,
        }),
        createRoute({
          getParentRoute: () => cardLayoutRoute,
          path: "/judge-consistency",
          component: CardJudgeConsistencyPage,
        }),
        createRoute({
          getParentRoute: () => cardLayoutRoute,
          path: "/activity-log",
          component: CardActivityLogPage,
        }),
        createRoute({
          getParentRoute: () => cardLayoutRoute,
          path: "/reports",
          component: CardReportsPage,
        }),
      ]),
      createRoute({
        getParentRoute: () => adminShellRoute,
        path: "/card/$cardId/bout/$boutId",
        component: BoutPage,
      }),
      settingsLayoutRoute.addChildren([
        createRoute({
          getParentRoute: () => settingsLayoutRoute,
          path: "/",
          component: SettingsDataPage,
        }),
        createRoute({
          getParentRoute: () => settingsLayoutRoute,
          path: "/google-drive",
          component: SettingsGoogleDrivePage,
        }),
      ]),
    ]),
  ]),
  scoreboardRoute,
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/setup",
    component: SetupPage,
  }),
]);

// A defaultPendingComponent makes the router wrap each route match in a
// Suspense boundary, which lazyRouteComponent (used above for code-split
// pages) relies on to show a fallback while its chunk loads.
const RoutePending = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
    <Spin size="large" />
  </div>
);

const router = createRouter({ routeTree, defaultPendingComponent: RoutePending });

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
      onError: (error, _variables, _context, mutation) => {
        if (mutation.options.meta?.hideGlobalError) return;
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

const ThemedApp = () => {
  const { mode, colors } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgBase: colors.bg,
          colorPrimary: colors.blue,
          borderRadius: radius.sm,
          borderRadiusLG: radius.lg,
          boxShadow: colors.shadowSm,
          boxShadowSecondary: colors.shadowMd,
        },
        components: {
          Button: { borderRadius: radius.md },
          Card: { borderRadiusLG: radius.lg },
          Table: { borderRadiusLG: radius.md, headerBg: colors.bgElevated },
          Drawer: { borderRadiusLG: radius.lg },
          Modal: { borderRadiusLG: radius.lg },
          Select: { borderRadius: radius.sm },
          Input: { borderRadius: radius.sm },
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
  );
};

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;
