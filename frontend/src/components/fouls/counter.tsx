import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";

export type CounterProps = {
  onAdd: () => void;
  onRemove: () => void;
  removeDisabled?: boolean;
};

const buttonStyle = { width: 44, height: 44 };

export const Counter = (props: CounterProps) => {
  return (
    <Space>
      <Button
        type="primary"
        style={buttonStyle}
        onClick={props.onAdd}
        icon={<PlusOutlined />}
      />
      <Button
        type="primary"
        style={buttonStyle}
        onClick={props.onRemove}
        disabled={props.removeDisabled}
        icon={<MinusOutlined />}
      />
    </Space>
  );
};
