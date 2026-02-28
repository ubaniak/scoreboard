import { Button, Form, Input, Space, type FormProps } from "antd";
import { type UpdateCardsProps } from "../../api/cards";
import type { CardRequestType } from "../../api/entities";
import type { Card } from "../../entities/cards";

type FieldType = {
  name?: string;
  date?: string;
  status?: string;
};

export type EditCardProps = {
  card: Card;
  onSubmit: (props: {
    id: CardRequestType;
    toUpdate: UpdateCardsProps;
  }) => void;
  onClose: () => void;
};

export const EditCard = (props: EditCardProps) => {
  const [form] = Form.useForm();
  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    props.onSubmit({
      id: { cardId: props.card.id },
      toUpdate: {
        name: values.name || "",
        date: values.date || "",
      },
    });
    props.onClose();
    form.resetFields();
  };

  return (
    <>
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        initialValues={{
          name: props.card.name,
          date: props.card.date,
          status: props.card.status,
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
