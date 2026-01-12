import { Divider, Space, Tag, Typography } from "antd";
import { BLUE, RED, type Corner } from "../../entities/corner";
import { Card } from "../card/card";
import { DisplayFouls } from "../fouls/display";
import { Show } from "../show/show";

const { Title, Text } = Typography;

export type CornerPanelProps = {
  isReady: boolean;
  corner: Corner;
  athleteName?: string;
  warnings?: string[];
  cautions?: string[];
  removeFoul?: (values: {
    corner: Corner;
    index: number;
    type: string;
  }) => void;
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
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
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
      <Divider style={{ margin: "12px 0" }} />
      <Show show={props.isReady}>
        <DisplayFouls
          fouls={props.warnings || []}
          type="caution"
          corner={props.corner}
          removeFoul={(values) => {
            if (props.removeFoul) {
              props.removeFoul({ ...values, type: "caution" });
            }
          }}
        />
        <DisplayFouls
          fouls={props.cautions || []}
          type="warning"
          corner={props.corner}
          removeFoul={(values) => {
            if (props.removeFoul) {
              props.removeFoul({ ...values, type: "warning" });
            }
          }}
        />
      </Show>
    </Card>
  );
};
