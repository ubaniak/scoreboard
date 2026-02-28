import {
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
} from "@ant-design/icons";
import { Tag, type TagProps } from "antd";
import type { JudgeDevice } from "../../entities/device";
import { ActionMenu } from "../actionMenu/actionMenu";
import { JudgeConnections } from "./JudgeConnection";

type Props = {
  devices: JudgeDevice[];
  requiredJudges: number;
  onRefreshCode: (props: { role: string }) => void;
};

export const JudgeConnectionQuickLook = ({
  devices,
  requiredJudges,
  onRefreshCode,
}: Props) => {
  const connectedCount = devices.filter(
    (device) => device.status === "connected",
  ).length;

  const allConnected = connectedCount >= requiredJudges;

  const tagProps: TagProps = {
    role: "button",
    style: {
      cursor: "pointer",
      userSelect: "none",
    },
    color: allConnected ? "success" : "error",
    icon: allConnected ? (
      <CheckCircleTwoTone twoToneColor="#52c41a" />
    ) : (
      <ExclamationCircleTwoTone twoToneColor="#ff4d4f" />
    ),
  };

  return (
    <ActionMenu
      trigger={{
        override: (onOpen) => (
          <>
            <Tag {...tagProps} onClick={() => onOpen()}>
              Judges {connectedCount}/{requiredJudges}
            </Tag>
          </>
        ),
      }}
      content={{
        title: "Connect Judge Devices",
        body: () => (
          <JudgeConnections devices={devices} onRefreshCode={onRefreshCode} />
        ),
      }}
    />
  );
};
