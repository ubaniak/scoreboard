import { Button, Form, Input, Select, Space } from "antd";

type ClubOption = { value: number; label: string };

const AGE_CATEGORY_OPTIONS = [
  { value: "u13", label: "U13" },
  { value: "u15", label: "U15" },
  { value: "u17", label: "U17" },
  { value: "u19", label: "U19" },
  { value: "elite", label: "Elite" },
  { value: "masters", label: "Masters" },
];

type AddAthleteProps = {
  clubs: ClubOption[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (v: {
    name: string;
    ageCategory: string;
    nationality: string;
    clubId?: number;
    provinceName?: string;
    provinceImageUrl?: string;
    nationName?: string;
    nationImageUrl?: string;
  }) => Promise<unknown>;
};

export const AddAthlete = ({ clubs, onClose, onSubmit }: AddAthleteProps) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" onFinish={(v) => {
      onClose(onSubmit(v).then(() => form.resetFields()));
    }}>
      <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Age Category" name="ageCategory" rules={[{ required: true, message: "Age category is required" }]}>
        <Select options={AGE_CATEGORY_OPTIONS} placeholder="Select age category..." />
      </Form.Item>
      <Form.Item label="Nationality" name="nationality" rules={[{ required: true, message: "Nationality is required" }]}><Input /></Form.Item>
      <Form.Item label="Club" name="clubId" rules={[{ required: true, message: "Club is required" }]}>
        <Select options={clubs} allowClear placeholder="Select club..." />
      </Form.Item>
      <Form.Item label="Province" name="provinceName"><Input placeholder="e.g., Ontario" /></Form.Item>
      <Form.Item label="Nation" name="nationName"><Input placeholder="e.g., Canada" /></Form.Item>
      <Space>
        <Button type="text" onClick={() => onClose()}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};
