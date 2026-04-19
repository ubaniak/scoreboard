import { Button, DatePicker, Form, Input, Select, Space } from "antd";
import dayjs from "dayjs";

type ClubOption = { value: number; label: string };

type AddAthleteProps = {
  clubs: ClubOption[];
  onClose: () => void;
  onSubmit: (v: { name: string; dateOfBirth: string; nationality: string; clubId?: number }) => void;
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
      <Space>
        <Button type="text" onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};
