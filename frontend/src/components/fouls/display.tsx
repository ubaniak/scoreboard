import { Button, List } from "antd";
import type { MutateHandleFoulProps } from "../../api/bouts";
import type { Corner, FoulTypes } from "../../entities/corner";

export type DisplayFoulsProps = {
  corner: Corner;
  type: FoulTypes;
  removeFoul: (values: MutateHandleFoulProps) => void;
  fouls: string[];
};

export const DisplayFouls = (props: DisplayFoulsProps) => {
  return (
    <>
      <List
        size="small"
        bordered
        dataSource={props.fouls}
        locale={{ emptyText: "No fouls recorded" }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                type="link"
                danger
                size="small"
                onClick={() =>
                  props.removeFoul({
                    corner: props.corner,
                    type: props.type,
                    foul: item,
                    action: "remove",
                  })
                }
              >
                Remove
              </Button>,
            ]}
          >
            {item}
          </List.Item>
        )}
      />
    </>
  );
};
