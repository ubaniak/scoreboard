import { PlusOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Tag } from "antd";
import { useState } from "react";

export type SelectFoulHandlerProps = {
  fouls: string[];
  onClose: () => void;
  onSelect: (selected: string) => void;
};

export const SelectFoulHandler = (props: SelectFoulHandlerProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleOnClick = () => {
    props.onSelect(selected || "");
    props.onClose();
    setSelected(null);
  };

  return (
    <Flex justify="space-between" vertical={true}>
      <Card>
        <Flex vertical={true}>
          {props.fouls.map((foul) => (
            <Tag.CheckableTag
              key={foul}
              icon={<PlusOutlined />}
              checked={selected === foul}
              onChange={() => setSelected(foul)}
              style={{
                flex: "1 0 30%",
                maxWidth: "30%",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {foul}
            </Tag.CheckableTag>
          ))}
        </Flex>
      </Card>
      <Button onClick={handleOnClick}>Add</Button>
    </Flex>
  );
};
