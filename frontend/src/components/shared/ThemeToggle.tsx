import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTheme } from "../../theme";

export const ThemeToggle = () => {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";
  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <Button
        shape="circle"
        type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      />
    </Tooltip>
  );
};
