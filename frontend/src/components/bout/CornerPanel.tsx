import { Space, Tag, Typography } from "antd";
import { BLUE, RED, type Corner } from "../../entities/corner";
import { Card } from "../card/card";

const { Title, Text } = Typography;

export type CornerPanelProps = {
  corner: Corner;
  athleteName?: string;
};

export const CornerPanel = (props: CornerPanelProps) => {
  return (
    <Card>
      <div
        style={{
          height: 6,
          background: props.corner === "red" ? RED : BLUE,
          borderRadius: 999,
          marginBottom: 14,
        }}
      />
      <Space orientation="vertical" size={6} style={{ width: "100%" }}>
        <Space align="center" wrap>
          <Tag color={props.corner} style={{ marginRight: 0, fontWeight: 700 }}>
            {"red" === props.corner ? "Red" : "Blue"}
          </Tag>
          <Text type="secondary">Corner</Text>
        </Space>
        <Title level={3} style={{ margin: 0, lineHeight: 1.15 }}>
          {props.athleteName || "—"}
        </Title>
      </Space>
    </Card>
  );
};
