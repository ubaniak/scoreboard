import { DownloadOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";

// Only renders when the browser says the app can be installed (Chrome,
// Edge, Android). Safari/iOS users install via Share → Add to Home Screen.
export const InstallAppButton = () => {
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <Tooltip title="Install Scoreboard as an app">
      <Button
        shape="circle"
        type="text"
        icon={<DownloadOutlined />}
        onClick={install}
        aria-label="Install Scoreboard as an app"
      />
    </Tooltip>
  );
};
