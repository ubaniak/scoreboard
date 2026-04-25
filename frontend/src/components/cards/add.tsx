import { Button, Form, Input, Space, type FormProps } from "antd";
import type { CreateCardProps } from "../../api/cards";

type FieldType = {
  name?: string;
  date?: string;
};

export type AddCardProps = {
  onSubmit: (props: CreateCardProps) => Promise<unknown>;
  onClose: (promise?: Promise<unknown>) => void;
};

export const AddCard = (props: AddCardProps) => {
  const [form] = Form.useForm();
  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    const p = props.onSubmit({ name: values.name || "", date: values.date || "" });
    props.onClose(p.then(() => form.resetFields()));
  };

  return (
    <>
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        initialValues={{
          name: "",
          date: "",
        }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
      >
        <Form.Item<FieldType> label="Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
          <Input />
        </Form.Item>
        <Form.Item<FieldType> label="Date" name="date" rules={[{ required: true, message: "Date is required" }]}>
          <Input type="date" />
        </Form.Item>
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
    </>
  );
};
