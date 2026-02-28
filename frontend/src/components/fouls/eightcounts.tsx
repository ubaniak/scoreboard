import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";

export type HandleEightCountProps = {
  onAdd: () => void;
  onRemove: () => void;
};

export const HandleEightCounts = (props: HandleEightCountProps) => {
  return (
    <>
      <Space>
        <Button
          type="primary"
          onClick={() => {
            props.onAdd();
          }}
          icon={<PlusOutlined />}
        />
        <Button
          type="primary"
          onClick={() => {
            props.onRemove();
          }}
          icon={<MinusOutlined />}
        />
      </Space>
    </>
  );
};
