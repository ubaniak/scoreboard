import { EyeOutlined } from "@ant-design/icons";
import { Input, Space, Tag } from "antd";
import { useMemo, useState } from "react";
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
  const [newFoul, setNewFoul] = useState("");

  const sortedFouls = useMemo(
    () => [...props.allFouls].sort((a, b) => a.localeCompare(b)),
    [props.allFouls],
  );

  const addFoul = (foul: string) => {
    const trimmed = foul.trim();
    if (!trimmed) return;
    props.handleFoul({
      corner: props.corner,
      type: props.type,
      foul: trimmed,
      action: "add",
    });
  };

  return (
    <Space direction="vertical" style={{ marginTop: 8, width: "100%" }} size={8}>
      <Space wrap size={[6, 6]}>
        {sortedFouls.map((foul) => (
          <Tag.CheckableTag
            key={foul}
            checked={false}
            onChange={() => addFoul(foul)}
            style={{
              border: "1px solid",
              borderColor: "rgba(255,255,255,0.2)",
              padding: "4px 10px",
              borderRadius: 999,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {foul}
          </Tag.CheckableTag>
        ))}
      </Space>
      <Space>
        <Input
          size="small"
          placeholder="Type new foul"
          value={newFoul}
          onChange={(e) => setNewFoul(e.target.value)}
          onPressEnter={() => {
            addFoul(newFoul);
            setNewFoul("");
          }}
          style={{ width: 200 }}
        />
        <ActionMenu
          trigger={{
            icon: <EyeOutlined />,
            ariaLabel: `View ${props.corner} ${props.type}s`,
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
              <DisplayFouls
                corner={props.corner}
                type={props.type}
                removeFoul={props.handleFoul}
                fouls={props.fouls}
              />
            ),
          }}
        />
      </Space>
    </Space>
  );
};
