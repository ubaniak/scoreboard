import { Outlet, useNavigate } from "@tanstack/react-router";
import { useProfile } from "../providers/login";
import { RoutedTabs } from "../components/shared/RoutedTabs";
import { PageLayout } from "../layouts/page";

export const SettingsPage = () => {
  const { token, role } = useProfile();
  const navigate = useNavigate();
  if (!token) return null;
  if (role !== "admin") {
    navigate({ to: "/" });
    return null;
  }

  return (
    <PageLayout
      title="Settings"
      breadCrumbs={[{ title: <a href="/">home</a> }, { title: "settings" }]}
      hideControls
    >
      <RoutedTabs
        items={[
          { key: "data", label: "Data", to: "/settings" },
          { key: "google-drive", label: "Google Drive", to: "/settings/google-drive" },
        ]}
      />
      <Outlet />
    </PageLayout>
  );
};
