import { Button, Form, Input, Space, type FormProps } from "antd";
import type { Official } from "../../entities/cards";
import type { UpdateOfficialProps } from "../../api/officials";

export type EditOfficialProps = {
  official: Official;
  onClose: () => void;
  onSubmit: (vals: {
    toUpdate: UpdateOfficialProps;
    officialId: string;
  }) => void;
};

export const EditOfficial = (props: EditOfficialProps) => {
  const onFinish: FormProps<UpdateOfficialProps>["onFinish"] = async (
    values
  ) => {
    props.onSubmit({ toUpdate: values, officialId: props.official.id });
    props.onClose();
  };
  return (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{
        name: props.official.name,
      }}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<UpdateOfficialProps> label="Name" name="name">
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
