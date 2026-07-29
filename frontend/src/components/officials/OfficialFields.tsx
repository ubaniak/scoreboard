import { Form, Input, InputNumber, Segmented, Select } from "antd";
import type { CreateOfficialProps } from "../../api/officials";

type Option = { value: number; label: string };

export type OfficialFieldsProps = {
  provinces: Option[];
  nations: Option[];
};

export const OfficialFields = ({ provinces, nations }: OfficialFieldsProps) => (
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
    <Form.Item<CreateOfficialProps> label="Province" name="provinceAffiliationId">
      <Select options={provinces} allowClear showSearch optionFilterProp="label" placeholder="Select province..." />
    </Form.Item>
    <Form.Item<CreateOfficialProps> label="Nation" name="nationAffiliationId">
      <Select options={nations} allowClear showSearch optionFilterProp="label" placeholder="Select nation..." />
    </Form.Item>
  </>
);
