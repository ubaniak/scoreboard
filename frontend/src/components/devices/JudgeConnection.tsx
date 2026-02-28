import { CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button, List, QRCode, Space, Typography } from "antd";
import { useGetBaseUrl } from "../../api/devices";
import type { JudgeDevice } from "../../entities/device";
import { useProfile } from "../../providers/login";
import { Card } from "../card/card";
import { DeviceStatusTag } from "../status/deviceStatusTag";
const { Text } = Typography;

export type JudgeConnectionProps = {
  onRefreshCode: (props: { role: string }) => void;
  devices: JudgeDevice[];
};

export const JudgeConnections = (props: JudgeConnectionProps) => {
  const { notification } = App.useApp();
  const { token } = useProfile();
  const { data: baseUrlData } = useGetBaseUrl({ token });
  const url = `http://${baseUrlData}:8080`; //?role=judge${props.judgeNumber}`;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    notification.success({
      message: "Code Copied",
      description: `Connection code ${code} copied to clipboard`,
      duration: 2,
    });
  };

  return (
    <Space orientation="vertical" size={16} align="center">
      <Card>
        <Space size={32}>
          <QRCode value={url} size={140} />
          <div>
            <Text type="secondary">Judge App</Text>
            <div style={{ fontSize: 18, fontWeight: 500 }}>
              Scan to open judge interface
            </div>
            <Text type="secondary">{url}</Text>
          </div>
        </Space>
      </Card>
      <Card title="Judge Devices">
        <List
          size="small"
          bordered
          dataSource={props.devices}
          renderItem={(d) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => copyCode(d.code)}
                />,
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={() => props.onRefreshCode({ role: d.role })}
                />,
              ]}
            >
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Space>
                  <Text>{d.role}</Text>
                  <Text type="secondary">({d.code})</Text>
                  <DeviceStatusTag status={d.status} />
                </Space>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
};
