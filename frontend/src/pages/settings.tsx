import { Tabs, Typography } from "antd";
import { useProfile } from "../providers/login";
import { DataDump } from "../components/settings/DataDump";
import { GoogleDrive } from "../components/settings/GoogleDrive";

const { Title } = Typography;

export const SettingsPage = () => {
  const { token } = useProfile();
  if (!token) return null;

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>Settings</Title>
      <Tabs
        items={[
          { key: "data", label: "Data", children: <DataDump token={token} /> },
          { key: "google-drive", label: "Google Drive", children: <GoogleDrive token={token} /> },
        ]}
      />
    </div>
  );
};
