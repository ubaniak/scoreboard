import { Button, List, Skeleton } from "antd";
import { useState } from "react";
import type { MutateHandleFoulProps } from "../../api/bouts";
import type { Corner, FoulTypes } from "../../entities/corner";

export type DisplayFoulsProps = {
  corner: Corner;
  type: FoulTypes;
  removeFoul: (values: MutateHandleFoulProps) => void;
  fouls: string[];
};

export const DisplayFouls = (props: DisplayFoulsProps) => {
  const [pendingFoul, setPendingFoul] = useState<string | null>(null);

  return (
    <List
      size="small"
      bordered
      dataSource={props.fouls}
      locale={{ emptyText: "No fouls recorded" }}
      renderItem={(item) => (
        <List.Item
          actions={[
            pendingFoul === item && props.fouls.includes(pendingFoul) ? (
              <Skeleton.Button active size="small" />
            ) : (
              <Button
                type="link"
                danger
                size="small"
                onClick={() => {
                  setPendingFoul(item);
                  props.removeFoul({
                    corner: props.corner,
                    type: props.type,
                    foul: item,
                    action: "remove",
                  });
                }}
              >
                Remove
              </Button>
            ),
          ]}
        >
          {item}
        </List.Item>
      )}
    />
  );
};
