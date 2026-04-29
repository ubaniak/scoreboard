import { SettingOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import { ActionMenu } from "../actionMenu/actionMenu";
import { useProfile } from "../../providers/login";
import { DataDump } from "./DataDump";
import { GoogleDrive } from "./GoogleDrive";

export const SettingsButton = () => {
  const { token } = useProfile();

  if (!token) return null;

  return (
    <ActionMenu
      trigger={{
        shape: "circle",
        icon: <SettingOutlined />,
        ariaLabel: "Settings",
      }}
      content={{
        title: "Settings",
        body: () => (
          <Tabs
            items={[
              {
                key: "data",
                label: "Data",
                children: <DataDump token={token} />,
              },
              {
                key: "google-drive",
                label: "Google Drive",
                children: <GoogleDrive token={token} />,
              },
            ]}
          />
        ),
      }}
      width={960}
    />
  );
};
