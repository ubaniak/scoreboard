import { Button, Form, Input, Select, Space } from "antd";
import type { AffiliationType, CreateAffiliationProps } from "../../api/affiliations";

const TYPE_OPTIONS: { value: AffiliationType; label: string }[] = [
  { value: "club", label: "Club" },
  { value: "province", label: "Province" },
  { value: "nation", label: "Nation" },
];

type AddAffiliationProps = {
  defaultType?: AffiliationType;
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (v: CreateAffiliationProps) => Promise<unknown>;
};

export const AddAffiliation = ({ defaultType, onClose, onSubmit }: AddAffiliationProps) => {
  const [form] = Form.useForm<CreateAffiliationProps>();
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ type: defaultType ?? "club" }}
      onFinish={(v) => onClose(onSubmit(v).then(() => form.resetFields()))}
    >
      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Type" name="type" rules={[{ required: true }]}>
        <Select options={TYPE_OPTIONS} />
      </Form.Item>
      <Space>
        <Button type="text" onClick={() => onClose()}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};
