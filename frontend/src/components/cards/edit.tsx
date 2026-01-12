import {
  Button,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  type FormProps,
} from "antd";
import { type UpdateCardsProps } from "../../api/cards";
import type { CardRequestType } from "../../api/entities";
import type { Card } from "../../entities/cards";

type FieldType = {
  name?: string;
  date?: string;
  status?: string;
  numberOfJudges: number;
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
        status: values.status || "",
        numberOfJudges: values.numberOfJudges,
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
          numberOfJudges: props.card.numberOfJudges,
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
        <Form.Item<FieldType> label="Status" name="status">
          <Select
            options={[
              { value: "upcoming", label: "Upcoming" },
              { value: "inProgress", label: "In Progress" },
              { value: "cancelled", label: "cancelled" },
              { value: "complete", label: "complete" },
            ]}
          />
        </Form.Item>
        <Form.Item<FieldType> label="judges" name="numberOfJudges">
          <Segmented
            size={"large"}
            shape="round"
            options={[
              { value: 3, label: "3" },
              { value: 5, label: "5" },
            ]}
          />
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
