import { Button, Form, Segmented, Select, Space } from "antd";
import { useState } from "react";
import type { Athlete } from "../../api/athletes";
import { AddToRoster } from "./add";

export type AddToRosterShellProps = {
  athletes: Athlete[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (athleteId: number) => Promise<unknown>;
};

type Mode = "single" | "bulk";

const AddToRosterBulk = ({ athletes, onClose, onSubmit }: AddToRosterShellProps) => {
  const [form] = Form.useForm<{ athleteIds: number[] }>();
  const [submitting, setSubmitting] = useState(false);
  const options = athletes.map((a) => ({ value: a.id, label: a.name }));

  const handleSubmit = async ({ athleteIds }: { athleteIds: number[] }) => {
    setSubmitting(true);
    try {
      for (const id of athleteIds) {
        await onSubmit(id);
      }
      onClose(Promise.resolve());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item label="Athletes" name="athleteIds" rules={[{ required: true, type: "array", min: 1 }]}>
        <Select mode="multiple" options={options} showSearch optionFilterProp="label" placeholder="Select athletes..." />
      </Form.Item>
      <Space>
        <Button type="text" onClick={() => onClose()}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>Add</Button>
      </Space>
    </Form>
  );
};

export const AddToRosterShell = (props: AddToRosterShellProps) => {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <div>
      <Segmented
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        style={{ marginBottom: 20 }}
        options={[
          { value: "single", label: "Add" },
          { value: "bulk", label: "Add Bulk" },
        ]}
      />

      {mode === "single" && (
        <AddToRoster athletes={props.athletes} onClose={props.onClose} onSubmit={props.onSubmit} />
      )}
      {mode === "bulk" && (
        <AddToRosterBulk athletes={props.athletes} onClose={props.onClose} onSubmit={props.onSubmit} />
      )}
    </div>
  );
};
