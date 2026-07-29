import { DatePicker, Divider, Form, Input, InputNumber, Segmented, Select, Typography, type FormInstance } from "antd";
import type { Dayjs } from "dayjs";
import { ageCategoryFromDOB } from "../../utils/ageCategory";

type Option = { value: number; label: string };

const AGE_CATEGORY_OPTIONS = [
  { value: "u13", label: "U13" },
  { value: "u15", label: "U15" },
  { value: "u17", label: "U17" },
  { value: "u19", label: "U19" },
  { value: "elite", label: "Elite" },
  { value: "masters", label: "Masters" },
];

export type AthleteFieldsProps = {
  form: FormInstance;
  clubs: Option[];
  provinces: Option[];
  nations: Option[];
};

export const AthleteFields = ({ form, clubs, provinces, nations }: AthleteFieldsProps) => {
  const handleDOBChange = (date: Dayjs | null) => {
    if (date) {
      form.setFieldValue("ageCategory", ageCategoryFromDOB(date));
    }
  };

  return (
    <>
      <Divider titlePlacement="left" plain style={{ marginTop: 0 }}>Identity</Divider>
      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Date of Birth" name="dateOfBirth" extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>Auto-fills age category</Typography.Text>}>
        <DatePicker format="YYYY-MM-DD" onChange={handleDOBChange} style={{ width: "100%" }} />
      </Form.Item>

      <Divider titlePlacement="left" plain>Classification</Divider>
      <Form.Item label="Age Category" name="ageCategory" rules={[{ required: true }]}>
        <Select options={AGE_CATEGORY_OPTIONS} placeholder="Select age category..." />
      </Form.Item>
      <Form.Item label="Gender" name="gender" rules={[{ required: true }]}>
        <Segmented
          size="large"
          shape="round"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Form.Item>
      <Form.Item label="Experience" name="experience" rules={[{ required: true }]}>
        <Segmented
          size="large"
          shape="round"
          options={[
            { value: "novice", label: "Novice" },
            { value: "open", label: "Open" },
          ]}
        />
      </Form.Item>
      <Form.Item label="Weight (kg)" name="weightClass">
        <InputNumber min={0} step={0.5} style={{ width: "100%" }} placeholder="Optional" />
      </Form.Item>

      <Divider titlePlacement="left" plain>Affiliation</Divider>
      <Form.Item label="Club" name="clubAffiliationId">
        <Select options={clubs} allowClear showSearch optionFilterProp="label" placeholder="Select club..." />
      </Form.Item>
      <Form.Item label="Province" name="provinceAffiliationId">
        <Select options={provinces} allowClear showSearch optionFilterProp="label" placeholder="Select province..." />
      </Form.Item>
      <Form.Item label="Nation" name="nationAffiliationId">
        <Select options={nations} allowClear showSearch optionFilterProp="label" placeholder="Select nation..." />
      </Form.Item>
    </>
  );
};
