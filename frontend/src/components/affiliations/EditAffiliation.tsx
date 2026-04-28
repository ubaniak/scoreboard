import { Button, Form, Input, Select, Space } from "antd";
import type {
  Affiliation,
  AffiliationType,
  UpdateAffiliationProps,
} from "../../api/affiliations";

const TYPE_OPTIONS: { value: AffiliationType; label: string }[] = [
  { value: "club", label: "Club" },
  { value: "province", label: "Province" },
  { value: "nation", label: "Nation" },
];

type EditAffiliationProps = {
  affiliation: Affiliation;
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (v: UpdateAffiliationProps) => Promise<unknown>;
};

export const EditAffiliation = ({ affiliation, onClose, onSubmit }: EditAffiliationProps) => {
  const [form] = Form.useForm<UpdateAffiliationProps>();
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ name: affiliation.name, type: affiliation.type }}
      onFinish={(v) => onClose(onSubmit(v))}
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
