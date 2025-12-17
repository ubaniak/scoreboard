import { Button, Form, Input, Space, type FormProps } from "antd";
import { useMutateCards } from "../../api/cards";
import { useProfile } from "../../providers/login";

type FieldType = {
  name?: string;
  date?: string;
};

export type CreateCardProps = {
  onClose: () => void;
};

export const CreateCard = (props: CreateCardProps) => {
  const profile = useProfile();
  const { mutateAsync: createCard } = useMutateCards();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    await createCard({
      token: profile.token,
      toCreate: {
        name: values.name || "",
        date: values.date || "",
      },
    });
    props.onClose();
  };

  return (
    <>
      <Form
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
