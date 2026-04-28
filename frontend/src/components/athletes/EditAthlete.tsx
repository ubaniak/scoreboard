import { Button, DatePicker, Form, Input, Segmented, Select, Space, Typography } from "antd";
import type { Dayjs } from "dayjs";
import type { Athlete, UpdateAthleteProps } from "../../api/athletes";
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

type EditAthleteProps = {
  athlete: Athlete;
  clubs: Option[];
  provinces: Option[];
  nations: Option[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (v: UpdateAthleteProps) => Promise<unknown>;
};

export const EditAthlete = ({ athlete, clubs, provinces, nations, onClose, onSubmit }: EditAthleteProps) => {
  const [form] = Form.useForm();

  const handleDOBChange = (date: Dayjs | null) => {
    if (date) {
      form.setFieldValue("ageCategory", ageCategoryFromDOB(date));
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        name: athlete.name,
        ageCategory: athlete.ageCategory,
        gender: athlete.gender,
        experience: athlete.experience,
        clubAffiliationId: athlete.clubAffiliationId,
        provinceAffiliationId: athlete.provinceAffiliationId,
        nationAffiliationId: athlete.nationAffiliationId,
      }}
      onFinish={(v) => {
        const clearClub = v.clubAffiliationId === undefined || v.clubAffiliationId === null;
        onClose(
          onSubmit({
            name: v.name,
            ageCategory: v.ageCategory,
            gender: v.gender,
            experience: v.experience,
            clubAffiliationId: clearClub ? undefined : v.clubAffiliationId,
            clearClubAffiliation: clearClub,
            provinceAffiliationId: v.provinceAffiliationId,
            nationAffiliationId: v.nationAffiliationId,
          }),
        );
      }}
    >
      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Date of Birth" name="dateOfBirth" extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>Auto-fills age category</Typography.Text>}>
        <DatePicker format="YYYY-MM-DD" onChange={handleDOBChange} style={{ width: "100%" }} />
      </Form.Item>
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
      <Form.Item label="Club" name="clubAffiliationId">
        <Select options={clubs} allowClear showSearch optionFilterProp="label" placeholder="Select club..." />
      </Form.Item>
      <Form.Item label="Province" name="provinceAffiliationId">
        <Select options={provinces} allowClear showSearch optionFilterProp="label" placeholder="Select province..." />
      </Form.Item>
      <Form.Item label="Nation" name="nationAffiliationId">
        <Select options={nations} allowClear showSearch optionFilterProp="label" placeholder="Select nation..." />
      </Form.Item>
      <Space>
        <Button type="text" onClick={() => onClose()}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};
