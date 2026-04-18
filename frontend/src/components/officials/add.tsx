import { Button, Form, Input, InputNumber, Segmented, Space, type FormProps } from "antd";
import type { CreateOfficialProps } from "../../api/officials";

export type AddOfficialProps = {
  onClose: () => void;
  onSubmit: (values: CreateOfficialProps) => void;
};

export const AddOfficial = (props: AddOfficialProps) => {
  const onFinish: FormProps<CreateOfficialProps>["onFinish"] = async (values) => {
    props.onSubmit(values);
    props.onClose();
  };
  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
      layout="horizontal"
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<CreateOfficialProps> label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Nationality" name="nationality">
        <Input />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Gender" name="gender">
        <Segmented
          size="large"
          shape="round"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Year of Birth" name="yearOfBirth">
        <InputNumber style={{ width: "100%" }} min={1900} max={new Date().getFullYear()} />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Reg. Number" name="registrationNumber">
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
