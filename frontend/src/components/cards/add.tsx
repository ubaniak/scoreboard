import { Button, Form, Space, type FormProps } from "antd";
import type { CreateCardProps } from "../../api/cards";
import { CardFields } from "./CardFields";

export type AddCardProps = {
  onSubmit: (props: CreateCardProps) => Promise<unknown>;
  onClose: (promise?: Promise<unknown>) => void;
};

export const AddCard = (props: AddCardProps) => {
  const [form] = Form.useForm<CreateCardProps>();
  const onFinish: FormProps<CreateCardProps>["onFinish"] = (values) => {
    const p = props.onSubmit(values);
    props.onClose(p.then(() => form.resetFields()));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ name: "", date: "" }}
      onFinish={onFinish}
    >
      <CardFields />
      <Form.Item label={null}>
        <Space>
          <Button type="text" onClick={() => props.onClose()}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
