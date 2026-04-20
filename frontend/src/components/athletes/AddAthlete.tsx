import { Button, DatePicker, Form, Input, Select, Space } from "antd";
import dayjs from "dayjs";

type ClubOption = { value: number; label: string };

type AddAthleteProps = {
  clubs: ClubOption[];
  onClose: () => void;
  onSubmit: (v: {
    name: string;
    dateOfBirth: string;
    nationality: string;
    clubId?: number;
    provinceName?: string;
    provinceImageUrl?: string;
    nationName?: string;
    nationImageUrl?: string;
  }) => void;
};

export const AddAthlete = ({ clubs, onClose, onSubmit }: AddAthleteProps) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" onFinish={(v) => {
      onSubmit({ ...v, dateOfBirth: v.dateOfBirth ? dayjs(v.dateOfBirth).format("YYYY-MM-DD") : "" });
      onClose();
    }}>
      <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Date of Birth" name="dateOfBirth" rules={[{ required: true, message: "Date of birth is required" }]}>
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="Nationality" name="nationality" rules={[{ required: true, message: "Nationality is required" }]}><Input /></Form.Item>
      <Form.Item label="Club" name="clubId" rules={[{ required: true, message: "Club is required" }]}>
        <Select options={clubs} allowClear placeholder="Select club..." />
      </Form.Item>
      <Form.Item label="Province" name="provinceName"><Input placeholder="e.g., Ontario" /></Form.Item>
      <Form.Item label="Province image URL" name="provinceImageUrl"><Input placeholder="e.g., /uploads/provinces/on.png" /></Form.Item>
      <Form.Item label="Nation" name="nationName"><Input placeholder="e.g., Canada" /></Form.Item>
      <Form.Item label="Nation image URL" name="nationImageUrl"><Input placeholder="e.g., /uploads/nations/ca.png" /></Form.Item>
      <Space>
        <Button type="text" onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};
