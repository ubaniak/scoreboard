import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";

export type CounterProps = {
  onAdd: () => void;
  onRemove: () => void;
  removeDisabled?: boolean;
};

export const Counter = (props: CounterProps) => {
  return (
    <Space>
      <Button type="primary" onClick={props.onAdd} icon={<PlusOutlined />} />
      <Button
        type="primary"
        onClick={props.onRemove}
        disabled={props.removeDisabled}
        icon={<MinusOutlined />}
      />
    </Space>
  );
};
