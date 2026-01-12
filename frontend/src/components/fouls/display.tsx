import { useState } from "react";
import { List, Button, Modal, Typography } from "antd";
import type { Corner, FoulTypes } from "../../entities/corner";

const { Text } = Typography;

export type DisplayFoulsProps = {
  corner: Corner;
  type: FoulTypes;
  removeFoul: (values: { corner: Corner; index: number }) => void;
  fouls: string[];
};

export const DisplayFouls = (props: DisplayFoulsProps) => {
  const [open, setOpen] = useState(false);

  const count = props.fouls.length;

  return (
    <>
      {/* Summary Row */}
      <List
        size="small"
        bordered
        style={{ marginTop: 12 }}
        dataSource={[props.type]}
        locale={{ emptyText: "No fouls recorded" }}
        renderItem={() => (
          <List.Item
            style={{ cursor: count > 0 ? "pointer" : "default" }}
            onClick={() => count > 0 && setOpen(true)}
          >
            <Text>
              {props.type} <Text type="secondary">({count})</Text>
            </Text>
          </List.Item>
        )}
      />

      {/* Modal */}
      <Modal
        open={open}
        title={`${props.type} (${count})`}
        footer={null}
        onCancel={() => setOpen(false)}
      >
        <List
          size="small"
          bordered
          dataSource={props.fouls}
          locale={{ emptyText: "No fouls recorded" }}
          renderItem={(item, idx) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() =>
                    props.removeFoul({
                      corner: props.corner,
                      index: idx,
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
      </Modal>
    </>
  );
};
