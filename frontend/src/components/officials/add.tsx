import { Button, Form, Input, Space, type FormProps } from "antd";
import type { CreateOfficialProps } from "../../api/officials";

export type AddOfficialProps = {
  onClose: () => void;
  onSubmit: (values: CreateOfficialProps) => void;
};

export const AddOfficial = (props: AddOfficialProps) => {
  const onFinish: FormProps<CreateOfficialProps>["onFinish"] = async (
    values
  ) => {
    props.onSubmit(values);
    props.onClose();
  };
  return (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{
        name: "",
      }}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<CreateOfficialProps> label="Name" name="name">
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
  );
};
