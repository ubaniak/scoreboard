import { Button, Form, Input, InputNumber, Segmented, Space, type FormProps } from "antd";
import type { Official } from "../../entities/cards";
import type { UpdateOfficialProps } from "../../api/officials";

export type EditOfficialProps = {
  official: Official;
  onClose: () => void;
  onSubmit: (vals: {
    toUpdate: UpdateOfficialProps;
    officialId: string;
  }) => void;
};

export const EditOfficial = (props: EditOfficialProps) => {
  const onFinish: FormProps<UpdateOfficialProps>["onFinish"] = async (values) => {
    props.onSubmit({ toUpdate: values, officialId: props.official.id });
    props.onClose();
  };
  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
      layout="horizontal"
      initialValues={{
        name: props.official.name,
        nationality: props.official.nationality,
        gender: props.official.gender,
        yearOfBirth: props.official.yearOfBirth,
        registrationNumber: props.official.registrationNumber,
        province: props.official.province,
        nation: props.official.nation,
      }}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<UpdateOfficialProps> label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item<UpdateOfficialProps> label="Nationality" name="nationality">
        <Input />
      </Form.Item>
      <Form.Item<UpdateOfficialProps> label="Gender" name="gender">
        <Segmented
          size="large"
          shape="round"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Form.Item>
      <Form.Item<UpdateOfficialProps> label="Year of Birth" name="yearOfBirth">
        <InputNumber style={{ width: "100%" }} min={1900} max={new Date().getFullYear()} />
      </Form.Item>
      <Form.Item<UpdateOfficialProps> label="Reg. Number" name="registrationNumber">
        <Input />
      </Form.Item>
      <Form.Item<UpdateOfficialProps> label="Province" name="province">
        <Input />
      </Form.Item>
      <Form.Item<UpdateOfficialProps> label="Nation" name="nation">
        <Input />
      </Form.Item>
      <Form.Item label={null}>
        <Space>
          <Button type="text" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
