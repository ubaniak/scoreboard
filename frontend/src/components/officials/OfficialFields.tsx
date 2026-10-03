import { Form, Input, InputNumber, Segmented } from "antd";
import type { CreateOfficialProps } from "../../api/officials";

export const OfficialFields = () => (
  <>
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
  </>
);
