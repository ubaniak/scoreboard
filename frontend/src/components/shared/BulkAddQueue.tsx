import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Form, type FormInstance } from "antd";
import { useState } from "react";
import { radius, space, useTheme } from "../../theme";

export type BulkAddQueueProps<T> = {
  onClose: (promise?: Promise<unknown>) => void;
  onSubmitAll: (items: T[]) => Promise<unknown>;
  renderFields: (form: FormInstance<T>) => React.ReactNode;
  renderQueueItem: (item: T) => React.ReactNode;
  initialValues?: Partial<T>;
  submitLabel?: string;
};

export const BulkAddQueue = <T,>(props: BulkAddQueueProps<T>) => {
  const { colors } = useTheme();
  const { message } = App.useApp();
  const [form] = Form.useForm<T>();
  const [queue, setQueue] = useState<T[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleQueue = (values: T) => {
    setQueue((q) => [...q, values]);
    form.resetFields();
  };

  const removeItem = (index: number) => setQueue((q) => q.filter((_, i) => i !== index));

  const handleSubmitAll = async () => {
    setSubmitting(true);
    try {
      await props.onSubmitAll(queue);
      props.onClose(Promise.resolve());
    } catch (err) {
      message.error((err as Error).message || "Failed to create — nothing after the failure was created");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical" initialValues={props.initialValues} onFinish={handleQueue}>
        {props.renderFields(form)}
        <Button type="dashed" htmlType="submit" icon={<PlusOutlined />} style={{ marginBottom: space.md }}>
          Add to queue
        </Button>
      </Form>

      <div style={{ marginBottom: space.sm, fontSize: 13, color: colors.textFaint }}>
        {queue.length} queued
      </div>

      {queue.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: colors.textFaint,
            fontSize: 13,
            border: `1px dashed ${colors.border}`,
            borderRadius: radius.lg,
            marginBottom: space.md,
          }}
        >
          Fill the form above and add entries to the queue before creating them.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: space.md,
          }}
        >
          {queue.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: radius.md,
                background: colors.bg,
                border: `1px solid ${colors.borderSubtle}`,
              }}
            >
              <span style={{ flex: 1, fontSize: 13 }}>{props.renderQueueItem(item)}</span>
              <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => removeItem(i)} aria-label="Remove from queue" />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button onClick={() => props.onClose()}>Cancel</Button>
        <Button type="primary" disabled={queue.length === 0} loading={submitting} onClick={handleSubmitAll}>
          {props.submitLabel ?? "Create"} {queue.length || ""}
        </Button>
      </div>
    </div>
  );
};
