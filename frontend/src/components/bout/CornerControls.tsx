import { SafetyCertificateOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Divider, Space, Tag } from "antd";
import { BLUE, RED, type Corner } from "../../entities/corner";
import { Card } from "../card/card";
import { Control } from "./Control";
import { Counter } from "../fouls/counter";
import type {
  MutateEightCountProps,
  MutateHandleFoulProps,
} from "../../api/bouts";

export type CornerPanelProps = {
  corner: Corner;
  handleFoul: (props: MutateHandleFoulProps) => void;
  handleEightCount: (props: MutateEightCountProps) => void;
  warnings: number;
  eightCounts: number;
};

export const CornerControls = (props: CornerPanelProps) => {
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
      <Space vertical size={6} style={{ width: "100%" }}>
        <Tag color={props.corner} style={{ fontWeight: 800 }}>
          {props.corner.toUpperCase()}
        </Tag>

        <Divider style={{ margin: "12px 0" }} />
        <Control
          corner={props.corner}
          icon={<SafetyCertificateOutlined />}
          label={`Warnings (${props.warnings})`}
          toolTip="Will remove points"
          action={
            <Counter
              onAdd={() => {
                props.handleFoul({
                  corner: props.corner,
                  type: "warning",
                  foul: "Warning",
                  action: "add",
                });
              }}
              onRemove={() => {
                props.handleFoul({
                  corner: props.corner,
                  type: "warning",
                  foul: "Warning",
                  action: "remove",
                });
              }}
              removeDisabled={props.warnings === 0}
            />
          }
        />
        <Control
          corner={props.corner}
          icon={<ThunderboltOutlined />}
          label={`Eight Counts (${props.eightCounts})`}
          toolTip="Referee's standing count"
          action={
            <Counter
              onAdd={() => {
                props.handleEightCount({
                  corner: props.corner,
                  direction: "up",
                });
              }}
              onRemove={() => {
                props.handleEightCount({
                  corner: props.corner,
                  direction: "down",
                });
              }}
            />
          }
        />
      </Space>
    </Card>
  );
};
