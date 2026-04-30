import { SettingOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useNavigate } from "@tanstack/react-router";
import { useProfile } from "../../providers/login";

export const SettingsButton = () => {
  const { token, role } = useProfile();
  const navigate = useNavigate();

  if (!token || role !== "admin") return null;

  return (
    <Button
      shape="circle"
      icon={<SettingOutlined />}
      aria-label="Settings"
      onClick={() => navigate({ to: "/settings" })}
    />
  );
};
