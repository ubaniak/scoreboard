import { Button, DatePicker, Form, Input, Select, Space } from "antd";
import dayjs from "dayjs";
import type { Athlete } from "../../api/athletes";

type ClubOption = { value: number; label: string };

type EditAthleteProps = {
  athlete: Athlete;
  clubs: ClubOption[];
  onClose: () => void;
  onSubmit: (v: { name?: string; dateOfBirth?: string; nationality?: string; clubId?: number; clearClub?: boolean }) => void;
};

export const EditAthlete = ({ athlete, clubs, onClose, onSubmit }: EditAthleteProps) => {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ ...athlete, dateOfBirth: athlete.dateOfBirth ? dayjs(athlete.dateOfBirth) : undefined }}
      onFinish={(v) => {
        const clearClub = v.clubId === undefined || v.clubId === null;
        onSubmit({
          name: v.name,
          dateOfBirth: v.dateOfBirth ? dayjs(v.dateOfBirth).format("YYYY-MM-DD") : undefined,
          nationality: v.nationality,
          clubId: clearClub ? undefined : v.clubId,
          clearClub,
        });
        onClose();
      }}
    >
      <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Date of Birth" name="dateOfBirth" rules={[{ required: true, message: "Date of birth is required" }]}>
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="Nationality" name="nationality" rules={[{ required: true, message: "Nationality is required" }]}><Input /></Form.Item>
      <Form.Item label="Club" name="clubId" rules={[{ required: true, message: "Club is required" }]}>
        <Select options={clubs} allowClear placeholder="Select club..." />
      </Form.Item>
      <Space>
        <Button type="text" onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};
