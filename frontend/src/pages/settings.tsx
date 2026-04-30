import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Flex, Tabs, Typography } from "antd";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useProfile } from "../providers/login";
import { DataDump } from "../components/settings/DataDump";
import { GoogleDrive } from "../components/settings/GoogleDrive";

const { Title } = Typography;

export const SettingsPage = () => {
  const { token, role } = useProfile();
  const navigate = useNavigate();
  const router = useRouter();
  if (!token) return null;
  if (role !== "admin") {
    navigate({ to: "/" });
    return null;
  }

  const handleBack = () => {
    if (router.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          aria-label="Back"
        />
        <Title level={3} style={{ margin: 0 }}>Settings</Title>
      </Flex>
      <Tabs
        items={[
          { key: "data", label: "Data", children: <DataDump token={token} /> },
          { key: "google-drive", label: "Google Drive", children: <GoogleDrive token={token} /> },
        ]}
      />
    </div>
  );
};
