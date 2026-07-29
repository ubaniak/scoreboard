import { Button, Form, Space } from "antd";
import type { AffiliationType, CreateAffiliationProps } from "../../api/affiliations";
import { AffiliationFields } from "./AffiliationFields";

type AddAffiliationProps = {
  defaultType?: AffiliationType;
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (v: CreateAffiliationProps) => Promise<unknown>;
};

export const AddAffiliation = ({ defaultType, onClose, onSubmit }: AddAffiliationProps) => {
  const [form] = Form.useForm<CreateAffiliationProps>();
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ type: defaultType ?? "club" }}
      onFinish={(v) => onClose(onSubmit(v).then(() => form.resetFields()))}
    >
      <AffiliationFields />
      <Space>
        <Button type="text" onClick={() => onClose()}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};
