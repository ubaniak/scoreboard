import { Form, Input } from "antd";
import type { CreateCardProps } from "../../api/cards";

export const CardFields = () => (
  <>
    <Form.Item<CreateCardProps> label="Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
      <Input />
    </Form.Item>
    <Form.Item<CreateCardProps> label="Date" name="date" rules={[{ required: true, message: "Date is required" }]}>
      <Input type="date" />
    </Form.Item>
  </>
);
