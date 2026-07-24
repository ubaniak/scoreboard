import { Button, Form, Select, Space } from "antd";
import type { Athlete } from "../../api/athletes";

type AddToRosterProps = {
  athletes: Athlete[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (athleteId: number) => Promise<unknown>;
};

export const AddToRoster = ({ athletes, onClose, onSubmit }: AddToRosterProps) => {
  const [form] = Form.useForm();

  const options = athletes.map((a) => ({ value: a.id, label: a.name }));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(v) => {
        onClose(onSubmit(v.athleteId).then(() => form.resetFields()));
      }}
    >
      <Form.Item label="Athlete" name="athleteId" rules={[{ required: true }]}>
        <Select
          options={options}
          showSearch
          optionFilterProp="label"
          placeholder="Select athlete..."
        />
      </Form.Item>
      <Space>
        <Button type="text" onClick={() => onClose()}>Cancel</Button>
        <Button type="primary" htmlType="submit">Add</Button>
      </Space>
    </Form>
  );
};
