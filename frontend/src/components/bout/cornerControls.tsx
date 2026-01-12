import {
  FlagOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Divider, Space, Tag, Typography } from "antd";
import type { MutateAddFoulProps } from "../../api/bouts";
import { BLUE, RED, type Corner } from "../../entities/corner";
import { Card } from "../card/card";
import { AddFoul } from "../fouls/add";
import { Control } from "./control";

const { Text } = Typography;

export type CornerPanelProps = {
  corner: Corner;
  fouls: string[];
  addFoul: (props: MutateAddFoulProps) => void;
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
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Space align="center" wrap>
          <Tag color={props.corner} style={{ fontWeight: 800, marginRight: 0 }}>
            {props.corner.toUpperCase()}
          </Tag>
          <Text type="secondary">Corner inputs</Text>
        </Space>

        <Divider style={{ margin: "12px 0" }} />
        <Control
          corner={props.corner}
          icon={<FlagOutlined />}
          label="Cautions"
          toolTip="Minor infractions"
          action={
            <AddFoul
              corner={props.corner}
              addFoul={props.addFoul}
              fouls={props.fouls}
              type="caution"
            />
          }
        />
        <Control
          corner={props.corner}
          icon={<SafetyCertificateOutlined />}
          label="Warnings"
          toolTip="Minor infractions"
          action={
            <AddFoul
              corner={props.corner}
              addFoul={props.addFoul}
              fouls={props.fouls}
              type="warning"
            />
          }
        />
        <Control
          corner={props.corner}
          icon={<ThunderboltOutlined />}
          label="Eight Counts"
          toolTip="Minor infractions"
          action={<>add action</>}
        />
      </Space>
    </Card>
  );
};
