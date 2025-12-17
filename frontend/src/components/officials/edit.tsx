import { DeleteOutlined } from "@ant-design/icons";
import { Button, Form, Input, Space, type FormProps } from "antd";
import {
  useMutateDeleteOfficial,
  useMutateUpdateOfficial,
} from "../../api/cards";
import type { Official } from "../../entities/cards";
import { useProfile } from "../../providers/login";

type FieldType = {
  name?: string;
};

export type EditOfficialProps = {
  cardId: string;
  official: Official;
  onClose: () => void;
};

export const EditOfficial = (props: EditOfficialProps) => {
  const profile = useProfile();
  const { mutateAsync: updateOfficial } = useMutateUpdateOfficial(
    props.cardId || "",
    props.official.id || ""
  );

  const { mutateAsync: deleteOfficial } = useMutateDeleteOfficial(
    props.cardId,
    profile.token
  );

  const handleDelete = async () => {
    await deleteOfficial(props.official.id || "");
    props.onClose();
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    await updateOfficial({
      token: profile.token,
      toUpdate: {
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
        name: props.official.name,
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
      <Form.Item label={null}>
        <Space>
          <Button
            color="danger"
            variant="outlined"
            onClick={handleDelete}
            icon={<DeleteOutlined />}
            iconPlacement={"end"}
          >
            Delete
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
