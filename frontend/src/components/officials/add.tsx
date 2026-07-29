import { Button, Form, Space, type FormProps } from "antd";
import type { CreateOfficialProps } from "../../api/officials";
import { OfficialFields } from "./OfficialFields";

type Option = { value: number; label: string };

export type AddOfficialProps = {
  provinces: Option[];
  nations: Option[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateOfficialProps) => Promise<unknown>;
};

export const AddOfficial = (props: AddOfficialProps) => {
  const [form] = Form.useForm<CreateOfficialProps>();
  const onFinish: FormProps<CreateOfficialProps>["onFinish"] = (values) => {
    props.onClose(props.onSubmit(values).then(() => form.resetFields()));
  };
  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <OfficialFields provinces={props.provinces} nations={props.nations} />
      <Form.Item label={null}>
        <Space>
          <Button type="text" onClick={() => props.onClose()}>Cancel</Button>
          <Button type="primary" htmlType="submit">Submit</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
