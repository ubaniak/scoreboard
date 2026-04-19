import { Button, Form, Input, Space } from "antd";

type AddClubProps = {
  onClose: () => void;
  onSubmit: (v: { name: string; location: string }) => void;
};

export const AddClub = ({ onClose, onSubmit }: AddClubProps) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" onFinish={(v) => { onSubmit(v); onClose(); }}>
      <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Location" name="location"><Input /></Form.Item>
      <Space>
        <Button type="text" onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};
