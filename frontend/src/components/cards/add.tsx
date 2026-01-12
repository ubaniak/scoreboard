import { Button, Form, Input, Space, type FormProps } from "antd";
import type { CreateCardProps } from "../../api/cards";

type FieldType = {
  name?: string;
  date?: string;
};

export type AddCardProps = {
  onSubmit: (props: CreateCardProps) => void;
  onClose: () => void;
};

export const AddCard = (props: AddCardProps) => {
  const [form] = Form.useForm();
  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    props.onSubmit({
      name: values.name || "",
      date: values.date || "",
    });
    props.onClose();
    form.resetFields();
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
        <Form.Item<FieldType> label="Name" name="name">
          <Input />
        </Form.Item>
        <Form.Item<FieldType> label="Date" name="date">
          <Input />
        </Form.Item>
        <Form.Item label={null}>
          <Space>
            <Button type="text" onClick={props.onClose}>
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
