import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import { Col, Divider, Row, Space, Typography } from "antd";
import type React from "react";
const { Text } = Typography;

export type ControlProps = {
  corner: "red" | "blue";
  icon: React.ReactElement<AntdIconProps>;
  label: string;
  toolTip?: string;
  action: React.ReactNode;
};

export const Control = (props: ControlProps) => {
  return (
    <Row
      align="middle"
      justify="space-between"
      gutter={12}
      style={{ padding: "10px 0" }}
    >
      <Col flex="auto">
        <Space>
          <span
            style={{
              width: 28,
              height: 28,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: "rgba(0,0,0,0.03)",
              border: "1px solid #f0f0f0",
              color: "rgba(0,0,0,0.65)",
            }}
          >
            {props.icon}
          </span>
          <Space direction="vertical" size={0}>
            <Text style={{ fontWeight: 700 }}>{props.label}</Text>
            {props.toolTip && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {props.toolTip}
              </Text>
            )}
          </Space>
        </Space>
      </Col>
      <Col>{props.action}</Col>
      <Divider style={{ margin: "0" }} />
    </Row>
  );
};
