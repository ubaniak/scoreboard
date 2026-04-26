import {
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
} from "@ant-design/icons";
import { Button, QRCode, Space, Tabs, Typography } from "antd";
import type { JudgeDevice } from "../../entities/device";
import { ActionMenu } from "../actionMenu/actionMenu";
import { JudgeConnections } from "./JudgeConnection";

const { Text } = Typography;

type Props = {
  devices: JudgeDevice[];
  requiredJudges: number;
  baseUrl?: string;
  onRefreshCode: (props: { role: string }) => void;
};

type ScorePanelTabProps = {
  baseUrl?: string;
};

const ScorePanelTab = ({ baseUrl }: ScorePanelTabProps) => {
  const url = baseUrl ? `http://${baseUrl}:8080/scoreboard` : "http://localhost:8080/scoreboard";

  return (
    <Space
      orientation="vertical"
      size={16}
      align="center"
      style={{ width: "100%" }}
    >
      <QRCode value={url} size={160} />
      <Space orientation="vertical" size={2} align="center">
        <Text type="secondary">Scan to open the score panel display</Text>
        <Text copyable>{url}</Text>
      </Space>
    </Space>
  );
};

export const DeviceQuickLook = ({
  devices,
  requiredJudges,
  baseUrl,
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
        <JudgeConnections
          devices={devices}
          baseUrl={baseUrl}
          onRefreshCode={onRefreshCode}
        />
      ),
    },
    {
      key: "scorePanel",
      label: "Score Panel",
      children: <ScorePanelTab baseUrl={baseUrl} />,
    },
  ];

  return (
    <ActionMenu
      trigger={{
        override: (onOpen) => (
          <Button
            icon={
              allConnected ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              ) : (
                <ExclamationCircleTwoTone twoToneColor="#ff4d4f" />
              )
            }
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
