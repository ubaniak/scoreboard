import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Select, Space, Tag } from "antd";
import { useState } from "react";
import type { MutateHandleFoulProps } from "../../api/bouts";
import type { Corner, FoulTypes } from "../../entities/corner";
import { ActionMenu } from "../actionMenu/actionMenu";
import { DisplayFouls } from "./display";

export type HandleFoulsProps = {
  allFouls: string[];
  fouls: string[];
  corner: Corner;
  type: FoulTypes;
  handleFoul: (props: MutateHandleFoulProps) => void;
};

export const HandleFouls = (props: HandleFoulsProps) => {
  const [selectedFoul, setSelectedFoul] = useState<string | null>(null);
  const fouls = props.allFouls.map((foul) => ({ label: foul, value: foul }));
  return (
    <>
      <Space style={{ marginTop: 8 }}>
        <Select
          mode="tags"
          placeholder="Select or type a foul"
          value={selectedFoul ? [selectedFoul] : []}
          onChange={(values) => setSelectedFoul(values.at(-1) || null)}
          options={fouls}
          style={{ width: 220 }}
          tokenSeparators={[","]}
        />

        <Button
          type="primary"
          disabled={!selectedFoul}
          onClick={() => {
            props.handleFoul({
              corner: props.corner,
              type: props.type,
              foul: selectedFoul!,
              action: "add",
            });
            setSelectedFoul(null);
          }}
          icon={<PlusOutlined />}
        />
        <ActionMenu
          trigger={{
            icon: <EyeOutlined />,
            aria_label: `View ${props.corner} ${props.type}s`,
          }}
          content={{
            title: (
              <>
                <Tag
                  color={props.corner}
                  style={{ fontWeight: 800, marginRight: 0 }}
                >
                  {props.corner.toUpperCase()}
                </Tag>
                {props.type}(s)
              </>
            ),
            body: () => (
              <>
                <DisplayFouls
                  corner={props.corner}
                  type={props.type}
                  removeFoul={props.handleFoul}
                  fouls={props.fouls}
                />
              </>
            ),
          }}
        />
      </Space>
    </>
  );
};
