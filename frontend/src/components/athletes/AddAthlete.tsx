import { Button, Form, Space } from "antd";
import type { CreateAthleteProps } from "../../api/athletes";
import { AthleteFields, type AthleteFieldsProps } from "./AthleteFields";
import { toCreateAthleteProps } from "./toCreateAthleteProps";

type Option = { value: number; label: string };

export type AddAthleteProps = {
  clubs: Option[];
  provinces: Option[];
  nations: Option[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (v: CreateAthleteProps) => Promise<unknown>;
};

export const AddAthlete = ({ clubs, provinces, nations, onClose, onSubmit }: AddAthleteProps) => {
  const [form] = Form.useForm();
  const fieldsProps: Omit<AthleteFieldsProps, "form"> = { clubs, provinces, nations };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(v) => {
        onClose(onSubmit(toCreateAthleteProps(v)).then(() => form.resetFields()));
      }}
    >
      <AthleteFields form={form} {...fieldsProps} />
      <Space>
        <Button type="text" onClick={() => onClose()}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};
