import { Button, Form, Input, Space, type FormProps } from "antd";
import { useMutateOfficial } from "../../api/cards";
import { useProfile } from "../../providers/login";

type FieldType = {
  name?: string;
};

export type AddOfficialProps = {
  carId: string;
  onClose: () => void;
};

export const AddOfficial = (props: AddOfficialProps) => {
  const profile = useProfile();
  const { mutateAsync: createOfficial } = useMutateOfficial(props.carId || "");
  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    await createOfficial({
      token: profile.token,
      toCreate: {
        name: values.name || "",
      },
    });
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
      <Form.Item<FieldType> label="Name" name="name">
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
