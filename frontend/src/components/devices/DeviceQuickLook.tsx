import {
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
} from "@ant-design/icons";
import { Button, QRCode, Space, Tabs, Typography } from "antd";
import type { JudgeDevice } from "../../entities/device";
import { useGetBaseUrl } from "../../api/devices";
import { useProfile } from "../../providers/login";
import { ActionMenu } from "../actionMenu/actionMenu";
import { JudgeConnections } from "./JudgeConnection";

const { Text } = Typography;

type Props = {
  devices: JudgeDevice[];
  requiredJudges: number;
  onRefreshCode: (props: { role: string }) => void;
};

const ScorePanelTab = () => {
  const { token } = useProfile();
  const { data: baseUrlData } = useGetBaseUrl({ token });
  const url = `http://${baseUrlData}:8080/scoreboard`;

  return (
    <Space direction="vertical" size={16} align="center" style={{ width: "100%" }}>
      <QRCode value={url || "http://localhost:8080/scoreboard"} size={160} />
      <Space direction="vertical" size={2} align="center">
        <Text type="secondary">Scan to open the score panel display</Text>
        <Text copyable>{url || "http://localhost:8080/scoreboard"}</Text>
      </Space>
    </Space>
  );
};

export const DeviceQuickLook = ({
  devices,
  requiredJudges,
  onRefreshCode,
}: Props) => {
  const connectedCount = devices.filter(
    (device) => device.status !== "offline" && device.status !== "unknown",
  ).length;

  const allConnected = connectedCount >= requiredJudges;

  const items = [
    {
      key: "judges",
      label: "Judges",
      children: (
        <JudgeConnections devices={devices} onRefreshCode={onRefreshCode} />
      ),
    },
    {
      key: "scorePanel",
      label: "Score Panel",
      children: <ScorePanelTab />,
    },
  ];

  return (
    <ActionMenu
      trigger={{
        override: (onOpen) => (
          <Button
            icon={allConnected
              ? <CheckCircleTwoTone twoToneColor="#52c41a" />
              : <ExclamationCircleTwoTone twoToneColor="#ff4d4f" />}
            onClick={onOpen}
          >
            Judges {connectedCount}/{requiredJudges}
          </Button>
        ),
      }}
      content={{
        title: "Devices",
        body: () => <Tabs items={items} />,
      }}
    />
  );
};
