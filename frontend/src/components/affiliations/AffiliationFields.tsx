import { Form, Input, Select } from "antd";
import type { AffiliationType } from "../../api/affiliations";

const TYPE_OPTIONS: { value: AffiliationType; label: string }[] = [
  { value: "club", label: "Club" },
  { value: "province", label: "Province" },
  { value: "nation", label: "Nation" },
];

export const AffiliationFields = () => (
  <>
    <Form.Item label="Name" name="name" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item label="Type" name="type" rules={[{ required: true }]}>
      <Select options={TYPE_OPTIONS} />
    </Form.Item>
  </>
);
