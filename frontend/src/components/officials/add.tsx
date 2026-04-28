import { Button, Form, Input, InputNumber, Segmented, Select, Space, type FormProps } from "antd";
import type { CreateOfficialProps } from "../../api/officials";

type Option = { value: number; label: string };

export type AddOfficialProps = {
  provinces: Option[];
  nations: Option[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateOfficialProps) => Promise<unknown>;
};

export const AddOfficial = (props: AddOfficialProps) => {
  const onFinish: FormProps<CreateOfficialProps>["onFinish"] = (values) => {
    props.onClose(props.onSubmit(values));
  };
  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
      layout="horizontal"
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<CreateOfficialProps> label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Nationality" name="nationality">
        <Input />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Gender" name="gender">
        <Segmented
          size="large"
          shape="round"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Year of Birth" name="yearOfBirth">
        <InputNumber style={{ width: "100%" }} min={1900} max={new Date().getFullYear()} />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Reg. Number" name="registrationNumber">
        <Input />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Province" name="provinceAffiliationId">
        <Select options={props.provinces} allowClear showSearch optionFilterProp="label" placeholder="Select province..." />
      </Form.Item>
      <Form.Item<CreateOfficialProps> label="Nation" name="nationAffiliationId">
        <Select options={props.nations} allowClear showSearch optionFilterProp="label" placeholder="Select nation..." />
      </Form.Item>
      <Form.Item label={null}>
        <Space>
          <Button type="text" onClick={() => props.onClose()}>Cancel</Button>
          <Button type="primary" htmlType="submit">Submit</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
