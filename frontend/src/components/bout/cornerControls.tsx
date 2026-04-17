import {
  FlagOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Divider, Space, Tag } from "antd";
import { BLUE, RED, type Corner } from "../../entities/corner";
import { Card } from "../card/card";
import { Control } from "./control";
import { HandleFouls } from "../fouls/handle";
import type {
  MutateEightCountProps,
  MutateHandleFoulProps,
} from "../../api/bouts";
import { HandleEightCounts } from "../fouls/eightcounts";


export type CornerPanelProps = {
  corner: Corner;
  allFouls: string[];
  handleFoul: (props: MutateHandleFoulProps) => void;
  handleEightCount: (props: MutateEightCountProps) => void;
  warnings: string[];
  cautions: string[];
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
      <Space orientation="vertical" size={6} style={{ width: "100%" }}>
        <Tag color={props.corner} style={{ fontWeight: 800 }}>
          {props.corner.toUpperCase()}
        </Tag>

        <Divider style={{ margin: "12px 0" }} />
        <Control
          corner={props.corner}
          icon={<FlagOutlined />}
          label={`Cautions (${props.cautions.length})`}
          toolTip="Minor infractions"
          action={
            <HandleFouls
              corner={props.corner}
              handleFoul={props.handleFoul}
              allFouls={props.allFouls}
              fouls={props.cautions}
              type="caution"
            />
          }
        />
        <Control
          corner={props.corner}
          icon={<SafetyCertificateOutlined />}
          label={`Warnings (${props.warnings.length})`}
          toolTip="Will remove points"
          action={
            <HandleFouls
              corner={props.corner}
              handleFoul={props.handleFoul}
              allFouls={props.allFouls}
              fouls={props.warnings}
              type="warning"
            />
          }
        />
        <Control
          corner={props.corner}
          icon={<ThunderboltOutlined />}
          label={`Eight Counts (${props.eightCounts})`}
          toolTip="Eight counts"
          action={
            <HandleEightCounts
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
