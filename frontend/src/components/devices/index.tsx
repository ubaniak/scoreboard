import { Avatar, Button, List, Modal, Popover } from "antd";
import { useState } from "react";
import { ConnectDevice } from "./connect";
import { useDeviceStatus } from "../../api/devices";
import { useProfile } from "../../providers/login";

export type DeviceIndexProps = {
  cardId: string;
  numberOfJudges: number;
};

type StatusProps = {
  status: string;
};

const Status = (props: StatusProps) => {
  const backgroundColors: Record<string, string> = {
    unknown: "#4444",
    connected: "#28a745",
    offline: "#dc3545",
  };

  const statusColor = backgroundColors[props.status] || "#4444";

  return (
    <Popover content={props.status} title="Status">
      <Avatar style={{ backgroundColor: statusColor }} />
    </Popover>
  );
};

export const DeviceIndex = (props: DeviceIndexProps) => {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const [connectJudgeNumber, setConnect] = useState<number>();
  const handleConnectDevice = (judgeNumber: number) => {
    setOpen(true);
    setConnect(judgeNumber);
  };

  const judges = Array.from({ length: props.numberOfJudges }, (_, i) => i + 1);

  const { data: devStatus } = useDeviceStatus(profile.token);

  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={judges}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => handleConnectDevice(item)}>
                connect
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Status status={devStatus?.data[`judge${item}`] || "unknown"} />
              }
              title={`Judge ${item}`}
            />
          </List.Item>
        )}
      />
      <Modal
        title="Connect Judge"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <ConnectDevice judgeNumber={connectJudgeNumber || 0} />
      </Modal>
    </>
  );
};
